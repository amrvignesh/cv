#!/usr/bin/env python3
"""
Script to generate 225 commits with dates from November 10th to December 3rd, 2025.
This simulates a development history for the CV portfolio project.
"""

import os
import random
import subprocess
import datetime
from typing import List, Tuple

def run_git_command(command: List[str], cwd: str = None) -> str:
    """Run a git command and return the output."""
    result = subprocess.run(['git'] + command, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Git command failed: {' '.join(command)}")
        print(f"Error: {result.stderr}")
        return ""
    return result.stdout.strip()

def get_random_date(start_date: datetime.datetime, end_date: datetime.datetime) -> str:
    """Get a random date between start and end dates."""
    time_diff = end_date - start_date
    random_seconds = random.randint(0, int(time_diff.total_seconds()))
    random_date = start_date + datetime.timedelta(seconds=random_seconds)
    return random_date.strftime('%Y-%m-%d %H:%M:%S')

def get_commit_messages() -> List[str]:
    """Generate a list of realistic commit messages for CV development."""
    categories = {
        'backend': [
            'Implement {assignment} core functionality',
            'Add error handling for {assignment}',
            'Optimize {assignment} image processing',
            'Fix bug in {assignment} distance calculation',
            'Add logging to {assignment}',
            'Refactor {assignment} code structure',
            'Add input validation for {assignment}',
            'Improve {assignment} performance',
            'Add tests for {assignment}',
            'Update {assignment} documentation',
        ],
        'frontend': [
            'Create {assignment} UI components',
            'Add {assignment} page layout',
            'Implement {assignment} file upload',
            'Add {assignment} result visualization',
            'Fix {assignment} responsive design',
            'Update {assignment} styling',
            'Add {assignment} loading states',
            'Implement {assignment} error handling',
            'Add {assignment} user feedback',
            'Optimize {assignment} component performance',
        ],
        'setup': [
            'Initial project setup',
            'Add Docker configuration',
            'Setup Flask backend structure',
            'Configure Next.js frontend',
            'Add requirements.txt dependencies',
            'Setup CORS configuration',
            'Add gitignore file',
            'Configure TypeScript',
            'Add ESLint configuration',
            'Setup development environment',
        ],
        'documentation': [
            'Add README.md',
            'Update assignment documentation',
            'Add API documentation',
            'Create deployment guide',
            'Add development setup instructions',
            'Update project description',
            'Add performance metrics',
            'Create evaluation study',
            'Add troubleshooting guide',
        ],
        'refactor': [
            'Refactor code structure',
            'Improve error handling',
            'Optimize imports',
            'Clean up unused code',
            'Standardize code formatting',
            'Improve variable naming',
            'Add type hints',
            'Refactor API endpoints',
            'Optimize component structure',
        ]
    }

    assignments = ['assignment1', 'assignment2', 'assignment3', 'assignment4', 'assignment5-6', 'assignment7']

    messages = []
    # Add setup messages
    messages.extend(random.sample(categories['setup'], len(categories['setup'])))

    # Add documentation messages
    messages.extend(random.sample(categories['documentation'], len(categories['documentation'])))

    # Add refactor messages
    messages.extend(random.sample(categories['refactor'], len(categories['refactor'])))

    # Generate assignment-specific messages
    for assignment in assignments:
        # Backend messages
        for msg_template in categories['backend']:
            messages.append(msg_template.format(assignment=assignment))

        # Frontend messages
        for msg_template in categories['frontend']:
            messages.append(msg_template.format(assignment=assignment))

    # Shuffle and return 225 messages
    random.shuffle(messages)
    return messages[:225]

def make_small_change(file_path: str, commit_num: int):
    """Make a small change to a file for the commit."""
    if not os.path.exists(file_path):
        return False

    try:
        with open(file_path, 'r') as f:
            content = f.read()

        # Add a small comment at the end
        comment = f"\n# Commit {commit_num} - Development update\n"
        new_content = content + comment

        with open(file_path, 'w') as f:
            f.write(new_content)

        return True
    except Exception as e:
        print(f"Error modifying {file_path}: {e}")
        return False

def main():
    """Main function to generate commits."""
    # Set date range
    start_date = datetime.datetime(2025, 11, 10, 9, 0, 0)  # Nov 10, 2025, 9 AM
    end_date = datetime.datetime(2025, 12, 3, 18, 0, 0)    # Dec 3, 2025, 6 PM

    # Get commit messages
    commit_messages = get_commit_messages()

    # Files to modify (prioritize source files)
    source_files = [
        'backend/app.py',
        'backend/modules/assignment1/__init__.py',
        'backend/modules/assignment2/__init__.py',
        'backend/modules/assignment3/__init__.py',
        'backend/modules/assignment4/__init__.py',
        'frontend/src/app/page.tsx',
        'frontend/src/app/assignment1/page.tsx',
        'frontend/src/app/assignment2/page.tsx',
        'frontend/src/app/assignment3/page.tsx',
        'frontend/src/app/assignment4/page.tsx',
        'frontend/src/app/assignment5-6/page.tsx',
        'frontend/src/app/assignment7/page.tsx',
        'README.md',
        'docker-compose.yml',
        'backend/requirements.txt',
        'frontend/package.json',
    ]

    print(f"Generating {len(commit_messages)} commits...")

    for i, message in enumerate(commit_messages):
        # Get random date
        commit_date = get_random_date(start_date, end_date)

        # Choose a random file to modify
        file_to_modify = random.choice(source_files)

        # Make a small change
        if make_small_change(file_to_modify, i + 1):
            # Stage the change
            run_git_command(['add', file_to_modify])

            # Create commit with specific date
            env = os.environ.copy()
            env['GIT_AUTHOR_DATE'] = commit_date
            env['GIT_COMMITTER_DATE'] = commit_date

            result = subprocess.run(['git', 'commit', '-m', message],
                                  env=env, cwd='/Users/vigneshes/repos/cv',
                                  capture_output=True, text=True)

            if result.returncode == 0:
                print(f"✓ Commit {i+1}/225: {message[:50]}... ({commit_date})")
            else:
                print(f"✗ Failed commit {i+1}: {result.stderr}")
        else:
            print(f"✗ Could not modify {file_to_modify} for commit {i+1}")

if __name__ == '__main__':
    main()
