jQuery(document).ready(function ($) {
	const version = mii_ajax_object.plugin_version || "unknown";
	const debugMode = mii_ajax_object.debug_mode === true || mii_ajax_object.debug_mode === "1" || mii_ajax_object.debug_mode === 1;

	if (debugMode) {
		console.log(`Marketo Impact Integration version ${version}. Verbose logging is enabled.`);
	} else {
		console.log(`Marketo Impact Integration version ${version}`);
	}

	// Check if MktoForms2 is loaded
	if (typeof window.MktoForms2 === "undefined") {
		console.warn("Marketo is not loaded on this site. Skipping integration.");
		return; // Exit the script gracefully
	}

	// Track processed forms to prevent duplicate handling
	const processedForms = new Set();

	// Wait for Impact library to load
	function waitForImpact(callback) {
		const interval = setInterval(() => {
			if (typeof impact !== "undefined" && typeof impact.api === "function") {
				clearInterval(interval);
				if (debugMode) {
					console.log("Impact library loaded. Proceeding with integration.");
				}
				callback();
			}
		}, 100); // Check every 100ms
	}

	// Main integration logic
	function integrateImpact() {
		// Wait for Marketo forms to be ready
		MktoForms2.whenReady(function (form) {
			const formId = form.getId(); // Get a unique identifier for the form

			// Check if the form has already been processed
			if (processedForms.has(formId)) {
				if (debugMode) {
					console.log(`Form ${formId} has already been processed. Skipping.`);
				}
				return;
			}

			// Mark the form as processed
			processedForms.add(formId);

			if (debugMode) {
				console.log(`Processing Marketo form with ID ${formId}.`);
			}

			// Check for a referral code using Impact API
			impact.api()
				.referralCookie()
				.then((res) => {
					if (debugMode) {
						console.log("Impact API referralCookie response:", res);
					}

					// Extract referral code
					const referralCode = res.codes ? Object.values(res.codes)[0] : null;

					if (!referralCode) {
						if (debugMode) {
							console.warn("No valid referral code found in Impact API response.");
						}
						return; // Stop the script if no referral code is found
					}

					if (debugMode) {
						console.log("Referral code found:", referralCode);
					}

					// Inject the referral code into the Marketo field if it exists
					if (mii_ajax_object.advocate_referral_id) {
						const advocateField = form.getFormElem().find(`[name="${mii_ajax_object.advocate_referral_id}"]`);
						if (advocateField.length > 0) {
							advocateField.val(referralCode);

							if (debugMode) {
								console.log(
									`Injected referral code "${referralCode}" into field "${mii_ajax_object.advocate_referral_id}".`
								);
							}
						} else if (debugMode) {
							console.warn(`Advocate referral field "${mii_ajax_object.advocate_referral_id}" not found on the form.`);
						}
					} else if (debugMode) {
						console.log("No advocate_referral_id specified; skipping injection.");
					}
				})
				.catch((error) => {
					if (debugMode) {
						console.error("Error fetching referral code from Impact API:", error);
					}
				});
		});
	}

	// Start the integration when Impact is ready
	waitForImpact(integrateImpact);
});