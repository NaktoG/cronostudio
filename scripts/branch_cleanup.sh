#!/usr/bin/env bash
set -euo pipefail

mode=${1:-list}

git fetch --prune

current_branch=$(git rev-parse --abbrev-ref HEAD)
protected_branches=("main" "develop")

is_protected() {
  local name=$1
  for protected in "${protected_branches[@]}"; do
    if [[ "$name" == "$protected" ]]; then
      return 0
    fi
  done
  return 1
}

list_merged_local() {
  git branch --merged | sed 's/^\* //g' | sed 's/^  //g'
}

list_merged_remote() {
  git branch -r --merged | sed 's/^  origin\///g' | sed 's/^origin\///g'
}

if [[ "$mode" == "list" ]]; then
  echo "Merged local branches (excluyendo main/develop):"
  while read -r branch; do
    [[ -z "$branch" ]] && continue
    is_protected "$branch" && continue
    [[ "$branch" == "$current_branch" ]] && continue
    echo "- $branch"
  done < <(list_merged_local)

  echo
  echo "Merged remote branches (excluyendo main/develop):"
  while read -r branch; do
    [[ -z "$branch" ]] && continue
    is_protected "$branch" && continue
    echo "- $branch"
  done < <(list_merged_remote)
  exit 0
fi

if [[ "$mode" == "delete-local" ]]; then
  while read -r branch; do
    [[ -z "$branch" ]] && continue
    is_protected "$branch" && continue
    [[ "$branch" == "$current_branch" ]] && continue
    git branch -D "$branch"
  done < <(list_merged_local)
  exit 0
fi

if [[ "$mode" == "delete-remote" ]]; then
  remote_branches=()
  while read -r branch; do
    [[ -z "$branch" ]] && continue
    is_protected "$branch" && continue
    remote_branches+=("$branch")
  done < <(list_merged_remote)

  if [[ ${#remote_branches[@]} -eq 0 ]]; then
    echo "No hay ramas remotas para borrar."
    exit 0
  fi

  git push origin --delete "${remote_branches[@]}"
  exit 0
fi

echo "Uso: $0 [list|delete-local|delete-remote]"
exit 1
