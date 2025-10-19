# PhishGuard Vision - Copilot Instructions

## 1. Project Goal
Build a Chrome extension for visual phishing detection, specifically designed to protect elderly users who may have low technical literacy.

## 2. Core Feature Implementation
- *Visual & Textual Analysis (Prompt API):*
    - Analyze page screenshots for visual phishing indicators (e.g., spoofed logos, suspicious button designs).
    - Analyze page text to detect fake urgency language (e.g., "Act now!", "Your account will be suspended").
    - Identify suspicious form designs that request sensitive data (e.g., SSN, passwords).
- *Real-Time Warnings:*
    - Display a non-intrusive, real-time overlay with a red border and a simple explanation (e.g., "This website looks suspicious") when a threat is detected.
- *Content Simplification (Summarizer API):*
    - Use the Summarizer API to distill complex Terms & Conditions or privacy policies into a few simple, plain-language bullet points.
- *Jargon Translation (Translator API):*
    - Use the Translator API to convert confusing legal or technical jargon into easy-to-understand explanations suitable for elderly users.
- *Trust Score:*
    - Calculate and display a simple "Trust Score" (e.g., a 1-5 star rating or a color code) based on the combined visual and text analysis.
- *Family Dashboard (Hybrid Functionality):*
    - Implement a secure, opt-in feature that sends an alert to a designated family member's email or device when the user visits a site with a very low trust score.

## 3. Development Rules & Constraints
1.  *Code Style:* Write clean, simple, and well-commented code. Prioritize readability and maintainability.
2.  *File Structure:* Keep individual file length to a minimum. Do not create any .md files other than this one.
3.  *API Usage:* You *must* exclusively use the official Chrome Extension APIs and built-in Gemini Nano APIs (Prompt, Summarizer, Translator, etc.).
4.  *No Third-Party APIs:* Do not use any other third-party libraries, external APIs, or generic Gemini APIs for the core AI functionality.