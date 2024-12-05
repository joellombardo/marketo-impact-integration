jQuery(document).ready(function ($) {
	const version = mii_ajax_object.plugin_version || "unknown";

	if (mii_ajax_object.debug_mode) {
		console.log(`Marketo Impact Integration version ${version}. Verbose logging is enabled.`);
	} else {
		console.log(`Marketo Impact Integration version ${version}`);
	}

	// Wait for Marketo Forms to be ready
	MktoForms2.whenReady(function (form) {
		form.onSuccess(function (values, followUpUrl) {
			const fieldValues = {};

			// Extract targeted fields from the form
			mii_ajax_object.fields_to_target.forEach(function (field) {
				fieldValues[field] = form.vals()[field] || "";
			});

			if (mii_ajax_object.debug_mode) {
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

					if (mii_ajax_object.debug_mode) {
						console.log("JWT received:", jwt);
					}

					// Decode JWT payload
					const base64Url = jwt.split(".")[1];
					const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
					const jsonPayload = JSON.parse(atob(base64));

					if (mii_ajax_object.debug_mode) {
						console.log("Decoded JWT payload:", jsonPayload);
					}

					// Construct the user configuration object
					const userConfig = {
						user: jsonPayload.user, // Extracted user object
						jwt: jwt, // Full JWT for authentication
					};

					if (mii_ajax_object.debug_mode) {
						console.log("Payload to upsertUser:", userConfig);
					}

					// Send the user configuration to Impact API
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
});