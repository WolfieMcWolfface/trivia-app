MY QUIZ V3

Purpose
A private, mobile-first quiz app. Each CSV is one quiz set. Difficulty is NOT stored in the question bank.

QUESTION BANK CSV FORMAT
Question,A,B,C,D,Correct
What year was the Leica I introduced?,1918,1925,1930,1935,B
Who wrote 1984?,Orwell,Huxley,Bradbury,Atwood,A
What is the capital of Japan?,Kyoto,Osaka,Tokyo,Nagoya,C

Rules
- Every question is stored as a complete four-option multiple-choice question.
- Standard mode shows A-D.
- Hard mode hides A-D and asks the player to type the correct answer.
- The same question can be Standard in one game and Hard in another.
- The filename becomes the quiz name, e.g. Cameras.csv -> Cameras.

FOLDER WORKFLOW
1. Keep CSV files in your OneDrive folder: Trivia App/Question-Bank.
2. Open index.html in Chrome or Edge.
3. Choose Question Bank -> Select Question-Bank Folder.
4. Select the Question-Bank folder.
5. The app scans all CSV files in that folder.

The browser cannot silently read an arbitrary OneDrive folder. The folder picker is a browser security requirement. Once selected, the app can scan the CSV files in that folder.

PLAYING
- Select a quiz.
- Choose number of questions.
- Choose Standard/Hard percentage.
- Start Quiz.
- Questions are selected randomly, then the difficulty presentation is assigned.

This build stores the imported question bank in browser local storage as a fallback. It does not upload questions to a server.
