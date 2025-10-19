// Test Chrome AI APIs from Extension Context

const statusDiv = document.getElementById('status');
const outputPre = document.getElementById('output');

function log(message, isError = false) {
    console.log(message);
    outputPre.textContent += message + '\n';
    if (isError) {
        statusDiv.className = 'status error';
        statusDiv.textContent = '❌ Error - see output below';
    }
}

function showSuccess(message) {
    statusDiv.className = 'status success';
    statusDiv.textContent = '✅ ' + message;
}

document.getElementById('checkAvailability').addEventListener('click', async () => {
    outputPre.textContent = '';
    log('=== Checking API Availability ===\n');
    
    try {
        // Check from extension context
        log(`self.ai: ${!!self.ai}`);
        log(`self.ai.languageModel: ${!!self.ai?.languageModel}`);
        log(`self.ai.summarizer: ${!!self.ai?.summarizer}`);
        log(`self.ai.translator: ${!!self.ai?.translator}`);
        log(`self.ai.rewriter: ${!!self.ai?.rewriter}`);
        log(`self.ai.languageDetector: ${!!self.ai?.languageDetector}`);
        
        log('\n--- Checking via chrome.aiOriginTrial (if available) ---');
        if (typeof chrome !== 'undefined' && chrome.aiOriginTrial) {
            log(`chrome.aiOriginTrial exists: true`);
            log(`chrome.aiOriginTrial.languageModel: ${!!chrome.aiOriginTrial?.languageModel}`);
        } else {
            log(`chrome.aiOriginTrial: not available`);
        }
        
        // Try to get capabilities
        if (self.ai?.languageModel) {
            log('\n--- Language Model Capabilities ---');
            try {
                const availability = await self.ai.languageModel.availability();
                log(`Availability: ${availability}`);
                
                if (availability === 'readily') {
                    const caps = await self.ai.languageModel.capabilities();
                    log(`Capabilities: ${JSON.stringify(caps, null, 2)}`);
                    showSuccess('AI APIs are available and ready!');
                } else if (availability === 'after-download') {
                    log('Model needs to be downloaded first');
                    showSuccess('APIs available but model needs download');
                } else {
                    log('Model not available on this device');
                }
            } catch (err) {
                log(`Error getting capabilities: ${err.message}`, true);
            }
        } else {
            log('\n❌ self.ai.languageModel is not available');
            log('This might be because:');
            log('1. Flags are not enabled in chrome://flags');
            log('2. Model is not downloaded');
            log('3. Extension permissions are incorrect');
        }
        
    } catch (err) {
        log(`\nError: ${err.message}`, true);
        log(err.stack);
    }
});

document.getElementById('testPrompt').addEventListener('click', async () => {
    outputPre.textContent = '';
    log('=== Testing Prompt API ===\n');
    
    try {
        if (!self.ai?.languageModel) {
            throw new Error('Prompt API not available. Check flags and model download.');
        }
        
        log('Creating session...');
        const session = await self.ai.languageModel.create({
            systemPrompt: 'You are a helpful assistant.'
        });
        
        log('Session created! Sending prompt...');
        const response = await session.prompt('Say hello in one short sentence!');
        
        log(`\n✅ Response:\n${response}`);
        showSuccess('Prompt API works!');
        
        session.destroy();
    } catch (err) {
        log(`\n❌ Error: ${err.message}`, true);
        log(err.stack);
    }
});

document.getElementById('testSummarizer').addEventListener('click', async () => {
    outputPre.textContent = '';
    log('=== Testing Summarizer API ===\n');
    
    try {
        if (!self.ai?.summarizer) {
            throw new Error('Summarizer API not available. Check flags.');
        }
        
        log('Creating summarizer...');
        const summarizer = await self.ai.summarizer.create({
            type: 'tl;dr',
            format: 'plain-text',
            length: 'short'
        });
        
        const longText = `
            Artificial intelligence is transforming technology. Machine learning enables
            computers to learn from data. Deep learning uses neural networks for complex
            tasks like image recognition and natural language processing. AI is becoming
            increasingly important in daily life.
        `;
        
        log('Summarizing text...');
        const summary = await summarizer.summarize(longText);
        
        log(`\n✅ Summary:\n${summary}`);
        showSuccess('Summarizer API works!');
        
        summarizer.destroy();
    } catch (err) {
        log(`\n❌ Error: ${err.message}`, true);
        log(err.stack);
    }
});

// Auto-check on load
window.addEventListener('load', () => {
    log('Extension AI Test loaded. Click buttons to test APIs.\n');
});
