# Use new)en
import pandas as pd
from transformers import pipeline
import torch
import numpy as np

class DifficultyScorer:
    def __init__(self, model_name="facebook/bart-large-mnli", device=-1):
        """
        Initializes the zero-shot classification pipeline.

        Args:
            model_name (str): Hugging Face model name for zero-shot classification.
            device (int): Device to run the model on (-1 for CPU, >=0 for GPU).
        """
        self.classifier = pipeline("zero-shot-classification", model=model_name, device=device)

    def score_difficulty(self, text):
        """
        Scores the input text for difficulty.

        Args:
            text (str): The text to classify.

        Returns:
            float: The difficulty score, or NaN for empty inputs.
        """
        if not text or pd.isna(text):
            return np.nan
        result = self.classifier(text, ["Easy", "Hard to Know"])
        # Return the score for "Hard to Know" as the difficulty score
        return result['scores'][result['labels'].index("Hard to Know")]

def main():
    # Load the cleaned JSON data into a pandas DataFrame
    df = pd.read_json('snopes_fact_checks_cleaned.json', orient='records')

    # Initialize the DifficultyScorer
    scorer = DifficultyScorer(model_name="facebook/bart-large-mnli", device=-1)

    print("Calculating difficulty scores. This may take a while...")
    
    def safe_score(x):
        try:
            return scorer.score_difficulty(x)
        except Exception as e:
            print(f"Error scoring: {x}")
            print(f"Error message: {str(e)}")
            return np.nan

    df['Difficulty_Score'] = df['Summary'].apply(safe_score)

    # Display the first few rows to verify
    print(df[['Title', 'Summary', 'Difficulty_Score']].head())

    # Save the updated DataFrame to a new CSV file
    df.to_csv('snopes_fact_checks_with_difficulty_score.csv', index=False)
    print("Scoring complete. Saved to 'snopes_fact_checks_with_difficulty_score.csv'.")

    print("\nDifficulty Score Statistics:")
    print(df['Difficulty_Score'].describe())

    # Example of how you might categorize based on the score
    print("\nExample categorization:")
    df['Difficulty_Category'] = pd.cut(df['Difficulty_Score'], 
                                       bins=[0, 0.33, 0.66, 1], 
                                       labels=['Easy', 'Medium', 'Hard'])
    print(df['Difficulty_Category'].value_counts(normalize=True))

if __name__ == "__main__":
    main()
