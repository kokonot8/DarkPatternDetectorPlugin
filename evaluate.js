// Define weights for different patterns
const PATTERN_WEIGHTS = {
    'pre-selected checkbox': 10,
    'confirmshaming': 10,
    'bait and switch': 50
    // Add other patterns with their weights as needed
  };
  
  // Maximum possible score
  const MAX_SCORE = 100;
  
  // Function to calculate the unethical score based on patterns
  export function calculateUnethicalScore(patternCounts) {
    // let totalScore = 0;
    // let maxPossibleScore = 0;
    
    // // Calculate the theoretical maximum possible score
    // // Assuming each pattern could occur up to 5 times on a page (arbitrary choice, adjust as needed)
    // const maxOccurrencesPerPattern = 5;
    // Object.keys(PATTERN_WEIGHTS).forEach(pattern => {
    //     maxPossibleScore += PATTERN_WEIGHTS[pattern] * maxOccurrencesPerPattern;
    // });
    
    // // Calculate weighted score for each detected pattern
    // Object.keys(patternCounts).forEach(pattern => {
    //     const count = patternCounts[pattern];
    //     const weight = PATTERN_WEIGHTS[pattern] || 5; // Default weight of 5 if pattern not defined
        
    //     // Add to total score (pattern weight * count)
    //     totalScore += weight * count;
    // });
    
    // // Calculate proportional score out of MAX_SCORE
    // const proportionalScore = Math.round((totalScore / maxPossibleScore) * MAX_SCORE);
    
    // return proportionalScore;


    let totalScore = 0;
    
    // Calculate weighted score for each pattern
    Object.keys(patternCounts).forEach(pattern => {
      const count = patternCounts[pattern];
      const weight = PATTERN_WEIGHTS[pattern] || 5; // Default weight of 5 if pattern not defined
      
      // Add to total score (pattern weight * count)
      totalScore += weight * count;
    });
    
    // Cap the score at MAX_SCORE
    return Math.min(totalScore, MAX_SCORE);
  }
  
  // Function to update the score display
  export function updateScoreDisplay(score) {
    const scoreElement = document.querySelector('.score-section p:first-child');
    const progressBar = document.querySelector('.score-section progress');
    const descriptionElement = document.querySelector('.score-section p:last-child');
    
    // Update score text
    scoreElement.textContent = `Unethical Score: ${score}/${MAX_SCORE}`;
    
    // Update progress bar
    progressBar.value = score;
    
    // Update description based on score ranges
    if (score < 20) {
      descriptionElement.textContent = 'A level';
    } else if (score < 40) {
      descriptionElement.textContent = 'B level';
    } else if (score < 60) {
      descriptionElement.textContent = 'C level';
    } else if (score < 80) {
        descriptionElement.textContent = 'D level';
    } else {
      descriptionElement.textContent = 'E level';
    }
  }