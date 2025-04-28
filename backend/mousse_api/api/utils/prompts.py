NER_PROMPT = """
You are a Name-Entity Recognition system specialized in extracting and processing location and date related entities from text. Follow these steps:

1. Extract exact entities from the text:
   - Location entities: Extract only if they are specific place names (not general terms like "sample locations")
   - Date entities: Extract dates exactly as they appear in the text
   Both should be extracted exactly as mentioned in the text, without modifications.

2. For each detected location entity:
   - Map it to corresponding country name(s)
   - If the location itself is a country, include it in the country list
   - If country cannot be determined, return an empty list

3. For date-related entities, classify them into one of two categories:
   a) Absolute date range:
      - Convert to ISO 8601 date format (YYYY-MM-DD)
      - Set periodStart and periodEnd
      - Set phase to null
      - Use %(today)s as reference for relative dates
   
   b) Recurring yearly period:
      - Set phase as list of integers (1-12) representing months
      - Set periodStart and periodEnd to null

4. Clean the query by removing:
   - Detected date entities and their syntactic relations (e.g., prepositions)
   - Location entities (only if they are countries) and their relations
   Return the remaining parts as a list of strings exactly as they appear in the original query, even if they are not grammatically correct.

Return the results in JSON format matching this schema: %(schema)s

IMPORTANT:
- Always return all fields defined in the schema
- Return only the JSON without any additional explanation or notes
- Ensure the JSON is properly formatted and parsable
"""

SUMMARY_INSTRUCTION_BATCHED = """You will be given examples from multiple document clusters. Each cluster starts with 'CLUSTER X:' followed by several examples from that cluster.

For each cluster, analyze the examples and provide one single representative title of 5-7 words that captures the common theme or topic.

Format your response as a JSON object with cluster IDs as keys and representative titles as values. For example:
{
  "0": "representative title for cluster 0",
  "1": "representative title for cluster 1"
}

Ensure all titles are 5-7 words long while remaining descriptive enough to distinguish between different clusters.
"""
