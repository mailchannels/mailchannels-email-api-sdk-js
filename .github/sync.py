"""Synchronize public upstream main and immutable tags without executing upstream code."""
import subprocess
import sys


def git(*args: str) -> str:
    """Run Git and return its output, failing on a nonzero exit."""
    return subprocess.check_output(['git', *args], text=True).strip()


def main() -> None:
    """Verify and atomically publish upstream source and immutable tags."""
    source = sys.argv[1]
    if git('status', '--porcelain'):
        raise SystemExit('Mirror checkout must be clean')
    git('fetch', '--no-tags', source,
        '+refs/heads/main:refs/remotes/mirror-source/main',
        'refs/tags/*:refs/mirror-tags/*')
    upstream = 'refs/remotes/mirror-source/main'
    if git('ls-tree', '-r', '--name-only', upstream, '--', '.github'):
        raise SystemExit('Upstream .github content requires a mirror maintainer review')
    git('merge', '--no-edit', '--no-ff', upstream)
    if git('diff', '--name-only', upstream, 'HEAD', '--', '.', ':(exclude).github'):
        raise SystemExit('Mirror source differs from upstream; refusing publication')
    tags = git('for-each-ref', '--format=%(refname)', 'refs/mirror-tags/').splitlines()
    refspecs = ['HEAD:refs/heads/main'] + [
        ref + ':refs/tags/' + ref.removeprefix('refs/mirror-tags/') for ref in tags
    ]
    # No force or deletion: moved tags and concurrent branch updates fail atomically.
    git('push', '--atomic', 'origin', *refspecs)
    print('Synchronized upstream', git('rev-parse', upstream), 'and', len(tags), 'tags')


if __name__ == '__main__':
    main()
