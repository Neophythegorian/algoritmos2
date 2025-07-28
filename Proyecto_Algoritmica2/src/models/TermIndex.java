package models;

import data_structures.AVLTree;
import data_structures.Trie;
import java.util.*;

public class TermIndex {
    private AVLTree avlTree;
    private Trie trie;

    public TermIndex() {
        this.avlTree = new AVLTree();
        this.trie = new Trie();
    }

    public void addTerm(String termName, int page) {
        Term existingTerm = avlTree.search(termName);

        if (existingTerm != null) {
            existingTerm.addPage(page);
        } else {
            Term newTerm = new Term(termName);
            newTerm.addPage(page);
            avlTree.insert(newTerm);
            trie.insert(newTerm);
        }
    }

    public void addTerm(String termName, Collection<Integer> pages) {
        Term existingTerm = avlTree.search(termName);

        if (existingTerm != null) {
            existingTerm.addPages(pages);
        } else {
            Term newTerm = new Term(termName, new TreeSet<>(pages));
            avlTree.insert(newTerm);
            trie.insert(newTerm);
        }
    }

    public Term getTerm(String termName) {
        return avlTree.search(termName);
    }

    public boolean removeTerm(String termName) {
        if (avlTree.delete(termName)) {
            trie.delete(termName);
            return true;
        }
        return false;
    }

    public void removePageFromTerm(int page, String termName) {
        Term term = avlTree.search(termName);
        if (term != null) {
            term.removePage(page);

            if (term.isEmpty()) {
                removeTerm(termName);
            }
        }
    }

    public boolean updateTermName(String oldName, String newName) {
        Term term = avlTree.search(oldName);
        if (term == null) return false;

        Set<Integer> pages = new TreeSet<>(term.getPages());
        removeTerm(oldName);
        addTerm(newName, pages);
        return true;
    }

    public List<Term> getTermsWithPrefix(String prefix) {
        return trie.searchByPrefix(prefix);
    }

    public Term getMostFrequentTerm() {
        List<Term> allTerms = avlTree.inOrderTraversal();
        if (allTerms.isEmpty()) return null;

        Term mostFrequent = allTerms.get(0);
        for (Term term : allTerms) {
            if (term.getPageCount() > mostFrequent.getPageCount()) {
                mostFrequent = term;
            }
        }

        return mostFrequent;
    }

    public List<Term> getAllTerms() {
        return avlTree.inOrderTraversal();
    }

    public boolean isEmpty() {
        return avlTree.isEmpty();
    }

    public void clear() {
        this.avlTree = new AVLTree();
        this.trie = new Trie();
    }
}