import os
from typing import Optional

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def is_openai_available() -> bool:
    return bool(OPENAI_API_KEY)


def generate_draft_with_openai(
    rfp_title: str,
    rfp_description: str,
    user_capabilities: list,
) -> Optional[str]:
    if not is_openai_available():
        return None

    try:
        from openai import OpenAI

        client = OpenAI(api_key=OPENAI_API_KEY)

        capabilities_text = ", ".join(user_capabilities) if user_capabilities else "general IT services"

        prompt = f"""Generate a structured RFP response proposal for the following opportunity:

Title: {rfp_title}
Description: {rfp_description[:2000]}
Capabilities: {capabilities_text}

Provide a professional proposal response with the following sections:
1. Executive Summary
2. Technical Approach
3. Past Performance
4. Key Personnel
5. Project Management Plan
6. Compliance Matrix
"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert proposal writer specializing in government contracting responses.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2500,
        )

        return response.choices[0].message.content
    except Exception:
        return None
