<?php
if(isset( $_POST['name']))
$name = $_POST['name'];
if(isset( $_POST['email']))
$email = $_POST['email'];
if(isset( $_POST['message']))
$message = $_POST['message'];
if(isset( $_POST['subject']))
$subject = $_POST['subject'];
if(isset( $_POST['sponsorship-package']))
$package = $_POST['sponsorship-package'];
if(isset( $_POST['company']))
$company = $_POST['company'];
if(isset( $_POST['phone']))
$phone = $_POST['phone'];

$content="From: $name \n Email: $email \n Message: $message";
$recipient = "sbshpe@gmail.com";
$mailheader = "From: $email \r\n";
$subject = "Sponsorship Package: $package Company: $company Phone Number: $phone";
mail($recipient, $subject, $content, $mailheader) or die("Error!");
echo "Email sent!";
?>