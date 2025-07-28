package services;

import models.Term;
import models.TermIndex;
import java.util.List;

public class IndexService {
    private TermIndex termIndex;
    private FileService fileService;

    public IndexService() {
        this.termIndex = new TermIndex();
        this.fileService = new FileService();
    }

    public void addTerm(String termName, int page) {
        termIndex.addTerm(termName, page);
    }

    public boolean removeTerm(String termName) {
        return termIndex.removeTerm(termName);
    }

    public void removePage(int page, String termName) {
        termIndex.removePageFromTerm(page, termName);
    }

    public boolean updateTermName(String oldName, String newName) {
        return termIndex.updateTermName(oldName, newName);
    }

    public List<Term> searchByPrefix(String prefix) {
        return termIndex.getTermsWithPrefix(prefix);
    }

    public Term getMostFrequentTerm() {
        return termIndex.getMostFrequentTerm();
    }

    public List<Term> getAllTerms() {
        return termIndex.getAllTerms();
    }

    public boolean loadFromFile(String filename) {
        return fileService.loadFromFile(filename, termIndex);
    }

    public boolean saveToFile(String filename) {
        return fileService.saveToFile(filename, termIndex);
    }

    public boolean isEmpty() {
        return termIndex.isEmpty();
    }

    public void displayIndex() {
        List<Term> terms = termIndex.getAllTerms();
        if (terms.isEmpty()) {
            System.out.println("El índice está vacío.");
            return;
        }

        System.out.println("\n=== ÍNDICE DE TÉRMINOS ===");
        for (Term term : terms) {
            System.out.println(term.toString());
        }
        System.out.println("========================\n");
    }

    public Term getTerm(String termName) {
        return termIndex.getTerm(termName);
    }
}