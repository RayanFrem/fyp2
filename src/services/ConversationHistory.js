let conversationHistory = [];

function storeConversation(userPrompt, botAnswer) {
  conversationHistory.push({ userPrompt, botAnswer });
}

function getRelevantContext() {
    if (conversationHistory.length === 0) {
      return null;
    }
  
    const lastInteraction = conversationHistory[conversationHistory.length - 1];
    return {
      userPrompt: lastInteraction.userPrompt,
      botAnswer: lastInteraction.botAnswer,
    };
  }  

module.exports = {
  storeConversation,
  getRelevantContext,
};