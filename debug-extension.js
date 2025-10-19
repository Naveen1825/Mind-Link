// Extension Debug Helper
// Paste this in DevTools Console on any webpage where the extension is loaded

console.log('=== PhishGuard Vision Extension Debug ===\n');

// Check if extension API is loaded
console.log('1. Checking extension API...');
if (window.__notesio_api) {
    console.log('✅ Extension API loaded');
    
    // Check availability functions
    console.log('\n2. API Availability Check:');
    console.log('   - isChromeAIAvailable():', window.__notesio_api.isChromeAIAvailable());
    console.log('   - isSummarizerAvailable():', window.__notesio_api.isSummarizerAvailable());
    console.log('   - isTranslatorAvailable():', window.__notesio_api.isTranslatorAvailable());
    console.log('   - isRewriterAvailable():', window.__notesio_api.isRewriterAvailable());
    
    // Check global APIs
    console.log('\n3. Global AI APIs:');
    console.log('   - typeof LanguageModel:', typeof LanguageModel);
    console.log('   - typeof Summarizer:', typeof Summarizer);
    console.log('   - typeof Translator:', typeof Translator);
    console.log('   - typeof Rewriter:', typeof Rewriter);
    
    // Test the API
    console.log('\n4. Testing Extension API...');
    if (window.__notesio_api.isChromeAIAvailable()) {
        console.log('✅ Chrome AI is available! Testing...\n');
        
        (async () => {
            try {
                console.log('   Sending test prompt...');
                const response = await window.__notesio_api.callChromeAI('Say "Extension works!" in one sentence.');
                console.log('   ✅ Response:', response);
                console.log('\n🎉 Extension API works perfectly!');
            } catch (err) {
                console.error('   ❌ Extension API test failed:', err.message);
                console.error('   Full error:', err);
                
                console.log('\n📋 Troubleshooting:');
                console.log('   - Check if model is ready: chrome://on-device-internals/');
                console.log('   - Check flags enabled: chrome://flags');
                console.log('   - Reload extension: chrome://extensions/');
            }
        })();
    } else {
        console.log('❌ Chrome AI is NOT available');
        console.log('\n📋 Troubleshooting:');
        console.log('   1. Check if LanguageModel is defined: typeof LanguageModel =', typeof LanguageModel);
        console.log('   2. Model downloaded? chrome://on-device-internals/');
        console.log('   3. Flags enabled? chrome://flags');
        console.log('      - prompt-api-for-gemini-nano → Enabled');
        console.log('      - summarization-api-for-gemini-nano → Enabled');
        console.log('      - optimization-guide-on-device-model → Enabled BypassPerfRequirement');
        console.log('   4. Reload extension at chrome://extensions/');
    }
} else {
    console.log('❌ Extension API NOT loaded');
    console.log('   - Extension may not be loaded on this page');
    console.log('   - Check if extension is enabled at chrome://extensions/');
    console.log('   - Reload the page');
}

console.log('\n=== End Debug ===');
