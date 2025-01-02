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
        return; // Exit script gracefully
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

            // Check if form has already been processed
            if (processedForms.has(formId)) {
                if (debugMode) {
                    console.log(`Form ${formId} has already been processed. Skipping.`);
                }
                return;
            }

            // Mark form as processed
            processedForms.add(formId);

            if (debugMode) {
                console.log(`Processing Marketo form with ID ${formId}.`);
            }

            // Check for referral code using Impact API
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
                        return; // Stop script if no referral code is found
                    }

                    if (debugMode) {
                        console.log("Referral code found:", referralCode);
                    }

                    // Inject referral code into the Marketo field if it exists
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
            form.onSuccess(function (values, followUpUrl) {
                const fieldValues = {};
                // Extract targeted fields from the form
                mii_ajax_object.fields_to_target.forEach(function (field) {
                    fieldValues[field] = form.vals()[field] || "";
                });
                if (debugMode) {
                    console.log("Field values collected:", fieldValues);
                }
                // Send form data to generate JWT
                $.ajax({
                    url: mii_ajax_object.ajax_url,
                    method: "POST",
                    data: {
                        action: "mii_send_data",
                        fieldValues: fieldValues,
                    },
                    success: function (response) {
                        const jwt = response.data.jwt;
                        if (debugMode) {
                            console.log("JWT received:", jwt);
                        }
                        // Decode JWT payload
                        const base64Url = jwt.split(".")[1];
                        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                        const jsonPayload = JSON.parse(atob(base64));
                        if (debugMode) {
                            console.log("Decoded JWT payload:", jsonPayload);
                        }
                        // Construct user configuration object
                        const userConfig = {
                            user: jsonPayload.user, // Extracted user object
                            jwt: jwt, // Full JWT for authentication
                        };
                        if (debugMode) {
                            console.log("Payload to upsertUser:", userConfig);
                        }
                        // Send user configuration to Impact API
                        impact.api()
                            .upsertUser(userConfig)
                            .then(function (response) {
                                console.log("User successfully upserted with Impact API");
                            })
                            .catch(function (error) {
                                console.error("Error upserting user with Impact API:", error);
                            });
                    },
                    error: function (error) {
                        console.error("Error sending data to generate JWT:", error);
                    },
                });
                return true; // Proceed with form submission
            });
            
        });
    }

    // Start the integration when Impact is ready
    waitForImpact(integrateImpact);
});