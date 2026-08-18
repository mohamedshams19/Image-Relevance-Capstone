const SIMILARITY_THRESHOLD = 0.4;
const CONFIDENCE_THRESHOLD = 0.6;

function checkCategoryRelevance(postText, imageSubject) {
  const postLower = postText.toLowerCase();
  const subjectWords = imageSubject.toLowerCase().split(/\s+/);

  const hasMatch = subjectWords.some(word => word.length > 2 && postLower.includes(word));
  return hasMatch;
}

function evaluateMatch(post, image, similarity) {
  const postText = `${post.title} ${post.content}`.toLowerCase();

  if (image.confidence < CONFIDENCE_THRESHOLD) {
    return {
      passed: false,
      reason: `Low vision confidence: image classification confidence (${image.confidence.toFixed(2)}) below threshold (${CONFIDENCE_THRESHOLD})`
    };
  }

  if (similarity < SIMILARITY_THRESHOLD) {
    return {
      passed: false,
      reason: `Similarity too low: score (${similarity.toFixed(4)}) below threshold (${SIMILARITY_THRESHOLD})`
    };
  }

  const categoryRelevant = checkCategoryRelevance(postText, image.subject);
  if (!categoryRelevant) {
    return {
      passed: false,
      reason: `Subject mismatch: post does not mention "${image.subject}" or related terms`
    };
  }

  return {
    passed: true,
    reason: `Match confirmed: "${image.subject}" is relevant to post, similarity ${similarity.toFixed(4)} above threshold, vision confidence ${image.confidence.toFixed(2)}`
  };
}

module.exports = { evaluateMatch, SIMILARITY_THRESHOLD, CONFIDENCE_THRESHOLD };