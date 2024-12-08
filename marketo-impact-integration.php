<?php
/*
Plugin Name: Marketo impact.com/advocate Integration
Description: Integrate Marketo forms with impact.com/advocate by capturing and upserting user data.
Version: 1.1.3
Author: Joel Lombardo
*/

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// Include Composer autoloader
require_once plugin_dir_path( __FILE__ ) . 'vendor/autoload.php';

use Firebase\JWT\JWT;

function mii_enqueue_scripts() {
	$debug_mode = get_option('mii_debug_mode', false);
	$plugin_data = get_file_data(__FILE__, ['Version' => 'Version']);
	$plugin_version = $plugin_data['Version'];

	// Use minified script in production if debug is off
	$script_file = $debug_mode ? 'js/impact-integration.js' : 'js/min/impact-integration.min.js';

	wp_enqueue_script('impact-integration-script', plugin_dir_url(__FILE__) . $script_file, array('jquery'), $plugin_version, true);

	wp_localize_script('impact-integration-script', 'mii_ajax_object', array(
		'ajax_url' => admin_url('admin-ajax.php'),
		'fields_to_target' => get_option('mii_fields_to_target', array('Email', 'FirstName', 'LastName')),
		'debug_mode' => (bool) get_option('mii_debug_mode', false),
		'plugin_version' => $plugin_version,
		'advocate_referral_id' => get_option('mii_advocate_referral_id', ''),
	));
}
add_action('wp_enqueue_scripts', 'mii_enqueue_scripts');

function mii_inject_utt_script() {
	$utt_script = get_option('mii_utt_script', '');

	if (!empty($utt_script)) {
		echo $utt_script;
	}
}
add_action('wp_head', 'mii_inject_utt_script');

function mii_plugin_action_links($links) {
	$settings_link = '<a href="tools.php?page=mii-settings">Settings</a>';
	array_unshift($links, $settings_link);
	return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'mii_plugin_action_links');

function mii_send_data() {
	$accountSid = get_option('mii_account_sid', '');
	$authToken = get_option('mii_auth_token', '');

	if (empty($accountSid) || empty($authToken)) {
		wp_send_json_error('Account SID or Auth Token not set.');
		wp_die();
	}

	$fieldValues = $_POST['fieldValues'];

	$email = sanitize_email($fieldValues['Email']);
	$firstName = sanitize_text_field($fieldValues['FirstName']);
	$lastName = sanitize_text_field($fieldValues['LastName']);
	$locale = isset($fieldValues['Locale']) ? sanitize_text_field($fieldValues['Locale']) : null;

	$userPayload = [
		"id" => $email,
		"accountId" => $email,
		"firstName" => $firstName,
		"lastName" => $lastName,
		"email" => $email,
	];

	if ($locale) {
		$userPayload["locale"] = $locale;
	}

	$jwtPayload = [
		"user" => $userPayload,
	];

	$headers = [
		"typ" => "JWT",
		"kid" => $accountSid,
	];

	try {
		$jwt = JWT::encode($jwtPayload, $authToken, 'HS256', null, $headers);
		wp_send_json_success(array('jwt' => $jwt));
	} catch (Exception $e) {
		wp_send_json_error('Error generating JWT: ' . $e->getMessage());
	}

	wp_die();
}
add_action('wp_ajax_mii_send_data', 'mii_send_data');
add_action('wp_ajax_nopriv_mii_send_data', 'mii_send_data');

function mii_admin_menu() {
	add_management_page(
		'Marketo impact/advocate Integration Settings',
		'Marketo impact/advocate Integration',
		'manage_options',
		'mii-settings',
		'mii_settings_page'
	);
}
add_action('admin_menu', 'mii_admin_menu');

function mii_settings_page() {
if (!current_user_can('manage_options')) {
	return;
}

if (isset($_POST['mii_save_settings'])) {
	check_admin_referer('mii_settings_nonce');

	// Unslash the $_POST data
	$mii_post_data = wp_unslash($_POST);

	update_option('mii_account_sid', sanitize_text_field($mii_post_data['mii_account_sid']));
	update_option('mii_auth_token', sanitize_text_field($mii_post_data['mii_auth_token']));
	update_option('mii_fields_to_target', array_map('sanitize_text_field', $mii_post_data['mii_fields_to_target']));
	update_option('mii_debug_mode', isset($mii_post_data['mii_debug_mode']));
	update_option('mii_advocate_referral_id', sanitize_text_field($mii_post_data['mii_advocate_referral_id']));

	// Define allowed HTML tags for sanitization
	$allowed_html = array(
		'script' => array(
			'src' => array(),
			'type' => array(),
			'async' => array(),
			'defer' => array(),
			'crossorigin' => array(),
			'integrity' => array(),
		),
	);

	// Sanitize the UTT script
	$utt_script_input = $mii_post_data['mii_utt_script'];
	update_option('mii_utt_script', wp_kses($utt_script_input, $allowed_html));

	echo '<div class="updated"><p>Settings saved.</p></div>';
}

$account_sid = get_option('mii_account_sid', '');
$auth_token = get_option('mii_auth_token', '');
$fields_to_target = get_option('mii_fields_to_target', array('Email', 'FirstName', 'LastName'));
$utt_script = get_option('mii_utt_script', '');
$debug_mode = get_option('mii_debug_mode', false);
$advocate_referral_id = get_option('mii_advocate_referral_id', '');

$plugin_data = get_file_data(__FILE__, ['Version' => 'Version']);
$plugin_version = $plugin_data['Version'];

?>
<div class="wrap">
	<h1>Marketo impact.com/advocate Integration Settings</h1>
	<form method="post" action="">
		<?php wp_nonce_field('mii_settings_nonce'); ?>

		<table class="form-table">
			<tr>
				<th scope="row"><label for="mii_account_sid">Account SID*</label></th>
				<td>
					<input name="mii_account_sid" type="text" id="mii_account_sid" value="<?php echo esc_attr($account_sid); ?>" class="regular-text">
					<p class="description">*Required</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="mii_auth_token">Auth Token*</label></th>
				<td>
					<input name="mii_auth_token" type="text" id="mii_auth_token" value="<?php echo esc_attr($auth_token); ?>" class="regular-text">
					<p class="description">*Required</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Fields to Target</th>
				<td>
					<label><input type="checkbox" name="mii_fields_to_target[]" value="Email" <?php checked(in_array('Email', $fields_to_target)); ?>> Email</label><br>
					<label><input type="checkbox" name="mii_fields_to_target[]" value="FirstName" <?php checked(in_array('FirstName', $fields_to_target)); ?>> First Name</label><br>
					<label><input type="checkbox" name="mii_fields_to_target[]" value="LastName" <?php checked(in_array('LastName', $fields_to_target)); ?>> Last Name</label><br>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="mii_advocate_referral_id">Marketo Referral Code Field</label></th>
				<td>
					<input name="mii_advocate_referral_id" type="text" id="mii_advocate_referral_id" value="<?php echo esc_attr($advocate_referral_id); ?>" class="regular-text">
					<p class="description">Optional: Specify the form field name used for capturing a referral code from the SaaSquatch cookie into Marketo.</p>
				</td>
			</tr>
			<tr>
				<th scope="row"><label for="mii_utt_script">Universal Tracking Tag</label></th>
				<td>
					<textarea name="mii_utt_script" id="mii_utt_script" class="large-text code" rows="10"><?php echo esc_textarea($utt_script); ?></textarea>
					<p class="description">Optional: Paste the Universal Tracking Tag script here. It will be injected into the &lt;head&gt;. Alternatively, manually add to Google Tag Manager or site head by other means.</p>
				</td>
			</tr>
			<tr>
				<th scope="row">Enable Debug Mode</th>
				<td>
					<label><input type="checkbox" name="mii_debug_mode" <?php checked($debug_mode); ?>> Enable verbose logging in console</label>
				</td>
			</tr>
		</table>

		<p class="submit"><input type="submit" name="mii_save_settings" id="submit" class="button button-primary" value="Save Changes"></p>
	</form>

		<hr>
		<p>
			<strong>Marketo impact.com/advocate Integration</strong> <?php echo esc_html($plugin_version); ?> by 
			<a href="https://github.com/joellombardo/marketo-impact-integration" target="_blank" rel="noopener noreferrer">Joel Lombardo</a>
		</p>
	</div>
	<?php
}