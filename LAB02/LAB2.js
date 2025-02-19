// Importing the prompt package
const prompt = require('prompt');

// Starting the prompt
prompt.start();

// Defining the function
function playRockPaperScissors() {
    // Ask the user for their choice
    prompt.get(['userSelection'], (err, result) => {
        if (err) {
            console.error('Error reading input:', err);
            return;
        }

        const userSelection = result.userSelection.toUpperCase();
        const validChoices = ['ROCK', 'PAPER', 'SCISSORS'];

        // Validate user input
        if (!validChoices.includes(userSelection)) {
            console.log('Invalid choice. Please select ROCK, PAPER, or SCISSORS.');
            return;
        }

        // Generate computer selection
        const randomValue = Math.random();
        let computerSelection;

        if (randomValue <= 0.34) {
            computerSelection = 'PAPER';
        } else if (randomValue <= 0.67) {
            computerSelection = 'SCISSORS';
        } else {
            computerSelection = 'ROCK';
        }

        // Display selections
        console.log(`User selected: ${userSelection}`);
        console.log(`Computer selected: ${computerSelection}`);

        // Determine the winner
        if (userSelection === computerSelection) {
            console.log("It's a tie");
        } else if (
            (userSelection === 'ROCK' && computerSelection === 'SCISSORS') ||
            (userSelection === 'PAPER' && computerSelection === 'ROCK') ||
            (userSelection === 'SCISSORS' && computerSelection === 'PAPER')
        ) {
            console.log('User Wins');
        } else {
            console.log('Computer Wins');
        }
    });
}

// Play the game
playRockPaperScissors();
