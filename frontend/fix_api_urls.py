#!/usr/bin/env python3
"""
Fix hardcoded localhost URLs in frontend files
"""

import os
import re

# Files to fix (relative to frontend directory)
files_to_fix = [
    "app/institutions/page.tsx",
    "app/institutions/[slug]/digest/page.tsx",
    "app/institutions/[slug]/admin/page.tsx",
    "app/institutions/[slug]/dashboard/page.tsx",
    "app/institutions/[slug]/benchmarking/page.tsx",
    "app/institutions/[slug]/page.tsx",
    "app/settings/notifications/page.tsx",
    "app/contexts/BrandingContext.tsx",
    "app/explore/page.tsx",
    "app/search/page.tsx",
    "app/dashboard/page.tsx",
    "app/journals/page.tsx",
    "app/journals/[slug]/page.tsx",
    "app/components/ReportButton.tsx",
    "app/components/SearchBar.tsx",
    "app/components/PostComposer.tsx",
    "app/users/[id]/digest/page.tsx",
    "app/users/[id]/page.tsx",
    "app/trending/page.tsx",
    "app/saved-searches/page.tsx",
    "app/onboarding/page.tsx",
    "app/topics/page.tsx",
    "app/topics/[slug]/page.tsx",
    "app/analytics/page.tsx",
    "app/moderation/page.tsx",
]


def get_import_path(file_path):
    """Calculate relative path to config/api.ts"""
    depth = file_path.count('/') - 1  # -1 because we're already in 'app'
    if depth == 0:
        return './config/api'
    else:
        return '../' * depth + 'config/api'


def fix_file(file_path):
    """Fix a single file"""
    if not os.path.exists(file_path):
        print(f"✗ File not found: {file_path}")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Calculate the correct import path
    import_path = get_import_path(file_path)
    import_statement = f"import {{ API_BASE_URL }} from '{import_path}'"

    # Check if import already exists
    if "API_BASE_URL" not in content:
        # Find the last import statement and add our import after it
        import_pattern = r'(import .*?(?:from .*?)?(?:;|\n))'
        imports = list(re.finditer(import_pattern, content, re.MULTILINE))

        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + f"\n{import_statement}" + content[insert_pos:]

    # Replace all hardcoded localhost URLs with template literals
    # Handle single quotes
    content = re.sub(
        r"'http://localhost:3001",
        r"`${API_BASE_URL}",
        content
    )

    # Handle double quotes
    content = re.sub(
        r'"http://localhost:3001',
        r"`${API_BASE_URL}",
        content
    )

    # Replace closing quotes with backticks (for the ones we just changed)
    # This handles cases like 'http://localhost:3001/posts' -> `${API_BASE_URL}/posts`
    content = re.sub(
        r"\`\$\{API_BASE_URL\}([^`'\"]*)'",
        r"`${API_BASE_URL}\1`",
        content
    )
    content = re.sub(
        r"\`\$\{API_BASE_URL\}([^`'\"]*)" + r'"',
        r"`${API_BASE_URL}\1`",
        content
    )

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed {file_path}")
        return True
    else:
        print(f"○ No changes needed for {file_path}")
        return False


def main():
    print("Fixing hardcoded API URLs in frontend files...\n")

    fixed_count = 0
    for file_path in files_to_fix:
        if fix_file(file_path):
            fixed_count += 1

    print(f"\n✓ Done! Fixed {fixed_count}/{len(files_to_fix)} files")
    print("API URL is now controlled by NEXT_PUBLIC_API_URL environment variable")


if __name__ == "__main__":
    main()
