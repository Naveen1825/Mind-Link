// Chrome AI API Availability Checker
// Paste this in DevTools Console to check all APIs

console.log('=== Chrome Built-in AI API Availability Test ===\n');

// Check Chrome version
const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
console.log(`Chrome Version: ${chromeVersion}`);
console.log(`User Agent: ${navigator.userAgent}\n`);

// Check if APIs are available
const availability = {
  // New Chrome 138+ Global APIs
  'LanguageModel (new)': typeof LanguageModel !== 'undefined',
  'Summarizer (new)': typeof Summarizer !== 'undefined',
  'Translator (new)': typeof Translator !== 'undefined',
  'Rewriter (new)': typeof Rewriter !== 'undefined',

  // Legacy self.ai APIs
  'self.ai': typeof self.ai !== 'undefined',
  'self.ai.languageModel (legacy)': !!(self.ai?.languageModel),
  'self.ai.summarizer (legacy)': !!(self.ai?.summarizer),
  'self.ai.translator (legacy)': !!(self.ai?.translator),
  'self.ai.rewriter (legacy)': !!(self.ai?.rewriter),
  'self.ai.languageDetector (legacy)': !!(self.ai?.languageDetector),

  // Chrome extension APIs
  'chrome.aiOriginTrial': typeof chrome !== 'undefined' && !!chrome.aiOriginTrial,
};

console.log('API Availability:');
console.table(availability);

// Test LanguageModel API (new)
if (typeof LanguageModel !== 'undefined') {
  console.log('\n✅ LanguageModel API is available! Testing...\n');

  (async () => {
    try {
      console.log('Creating LanguageModel session...');
      const session = await LanguageModel.create({
        outputLanguage: 'en'
      });

      console.log('✅ Session created successfully!');
      console.log('Session details:', {
        inputUsage: session.inputUsage,
        inputQuota: session.inputQuota,
        topK: session.topK,
        temperature: session.temperature
      });

      console.log('\nSending test prompt...');
      const response = await session.prompt('Say hello in one sentence!');
      console.log('✅ Response received:', response);

      session.destroy();
      console.log('✅ Session destroyed.');

      console.log('\n🎉 LanguageModel API works perfectly!');
    } catch (err) {
      console.error('❌ LanguageModel test failed:', err.message);
      console.error(err);
    }
  })();
} else {
  console.log('\n❌ LanguageModel API NOT available');
}

// Test Summarizer API (new)
if (typeof Summarizer !== 'undefined') {
  console.log('\n✅ Summarizer API is available! Testing...\n');

  setTimeout(async () => {
    try {
      console.log('Creating Summarizer...');
      const summarizer = await Summarizer.create({
        type: 'tldr',
        format: 'plain-text',
        length: 'short'
      });

      console.log('✅ Summarizer created successfully!');

      const testText = `Artificial intelligence (AI) is transforming technology. 
        Machine learning enables computers to learn from data. 
        Deep learning has led to breakthroughs in image recognition and natural language processing.`;

      console.log('\nSummarizing test text...');
      const summary = await summarizer.summarize(testText);
      console.log('✅ Summary:', summary);

      summarizer.destroy();
      console.log('✅ Summarizer destroyed.');

      console.log('\n🎉 Summarizer API works perfectly!');
    } catch (err) {
      console.error('❌ Summarizer test failed:', err.message);
      console.error(err);
    }
  }, 2000);
} else {
  console.log('\n❌ Summarizer API NOT available');
}

// Test Translator API (new)
if (typeof Translator !== 'undefined') {
  console.log('\n✅ Translator API is available!');

  setTimeout(async () => {
    try {
      console.log('\nChecking translation capability...');
      const canTranslate = await Translator.canTranslate({
        sourceLanguage: 'en',
        targetLanguage: 'es'
      });
      console.log('✅ Can translate EN→ES:', canTranslate);

      console.log('\n🎉 Translator API is accessible!');
    } catch (err) {
      console.error('❌ Translator test failed:', err.message);
    }
  }, 4000);
} else {
  console.log('\n❌ Translator API NOT available');
}

// Summary
setTimeout(() => {
  console.log('\n=== Summary ===');
  const newAPIs = availability['LanguageModel (new)'] || availability['Summarizer (new)'];
  const legacyAPIs = availability['self.ai.languageModel (legacy)'] || availability['self.ai.summarizer (legacy)'];

  if (newAPIs) {
    console.log('✅ New Chrome 138+ APIs are available!');
    console.log('Your extension should use: LanguageModel, Summarizer, Translator');
  } else if (legacyAPIs) {
    console.log('⚠️  Legacy self.ai APIs are available');
    console.log('Your extension will use fallback: self.ai.languageModel, self.ai.summarizer');
  } else {
    console.log('❌ NO AI APIs are available!');
    console.log('Required actions:');
    console.log('1. Enroll in EPP: https://developer.chrome.com/docs/ai/join-epp');
    console.log('2. Download model at: chrome://on-device-internals/');
    console.log('3. Enable flags at: chrome://flags');
    console.log('   - prompt-api-for-gemini-nano');
    console.log('   - summarization-api-for-gemini-nano');
    console.log('   - optimization-guide-on-device-model');
  }
}, 6000);

console.log('\n⏳ Running tests... (check console for results)');
