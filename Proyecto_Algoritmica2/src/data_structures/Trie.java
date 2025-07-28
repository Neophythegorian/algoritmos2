package data_structures;

import models.Term;
import java.util.*;

public class Trie {
    private TrieNode root;

    private class TrieNode {
        Map<Character, TrieNode> children;
        boolean isEndOfWord;
        Term term;

        TrieNode() {
            children = new HashMap<>();
            isEndOfWord = false;
            term = null;
        }
    }

    public Trie() {
        root = new TrieNode();
    }

    public void insert(Term term) {
        TrieNode current = root;
        String word = term.getName().toLowerCase();

        for (char ch : word.toCharArray()) {
            current.children.putIfAbsent(ch, new TrieNode());
            current = current.children.get(ch);
        }

        current.isEndOfWord = true;
        current.term = term;
    }

    public void delete(String termName) {
        delete(root, termName.toLowerCase(), 0);
    }

    private boolean delete(TrieNode current, String word, int index) {
        if (index == word.length()) {
            if (!current.isEndOfWord) {
                return false;
            }
            current.isEndOfWord = false;
            current.term = null;
            return current.children.isEmpty();
        }

        char ch = word.charAt(index);
        TrieNode node = current.children.get(ch);
        if (node == null) {
            return false;
        }

        boolean shouldDeleteChild = delete(node, word, index + 1);

        if (shouldDeleteChild) {
            current.children.remove(ch);
            return !current.isEndOfWord && current.children.isEmpty();
        }

        return false;
    }

    public List<Term> searchByPrefix(String prefix) {
        List<Term> results = new ArrayList<>();
        TrieNode current = root;
        String lowerPrefix = prefix.toLowerCase();

        for (char ch : lowerPrefix.toCharArray()) {
            current = current.children.get(ch);
            if (current == null) {
                return results;
            }
        }

        collectAllTerms(current, results);
        return results;
    }

    private void collectAllTerms(TrieNode node, List<Term> results) {
        if (node.isEndOfWord && node.term != null) {
            results.add(node.term);
        }

        for (TrieNode child : node.children.values()) {
            collectAllTerms(child, results);
        }
    }

    public void clear() {
        root = new TrieNode();
    }
}