import requests

url = 'https://api.ouedkniss.com/graphql'
headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Origin': 'https://www.ouedkniss.com',
    'Referer': 'https://www.ouedkniss.com/'
}

fields = [
    "description",
    "description { text }",
    "content",
    "content { html }",
    "defaultDescription"
]

for field in fields:
    query = f"""
    query SearchListings($q: String!, $page: Int!) {{
      searchAnnouncements(q: $q, categorySlug: "automobiles", page: $page, count: 1) {{
        announcements {{
          id
          title
          {field}
        }}
      }}
    }}
    """
    payload = {'query': query, 'variables': {'q': 'Golf', 'page': 1}}
    resp = requests.post(url, json=payload, headers=headers)
    print(f"Field: {field} -> Status: {resp.status_code}")
    if resp.status_code != 200:
        print(resp.json())
    else:
        print(resp.json().get('data', {}).get('searchAnnouncements', {}).get('announcements', [])[0])

