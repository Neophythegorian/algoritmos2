package models;

import java.util.*;

public class Term implements Comparable<Term> {
    private String name;
    private Set<Integer> pages;

    public Term(String name) {
        this.name = name.toLowerCase().trim();
        this.pages = new TreeSet<>();
    }

    public Term(String name, Set<Integer> pages) {
        this.name = name.toLowerCase().trim();
        this.pages = new TreeSet<>(pages);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name.toLowerCase().trim();
    }

    public Set<Integer> getPages() {
        return pages;
    }

    public void addPage(int page) {
        pages.add(page);
    }

    public void addPages(Collection<Integer> pages) {
        this.pages.addAll(pages);
    }

    public boolean removePage(int page) {
        return pages.remove(page);
    }

    public int getPageCount() {
        return pages.size();
    }

    public boolean isEmpty() {
        return pages.isEmpty();
    }

    @Override
    public int compareTo(Term other) {
        return this.name.compareTo(other.name);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Term term = (Term) obj;
        return Objects.equals(name, term.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }

    @Override
    public String toString() {
        List<Integer> sortedPages = new ArrayList<>(pages);
        Collections.sort(sortedPages);

        StringBuilder sb = new StringBuilder();
        sb.append(Character.toUpperCase(name.charAt(0)))
                .append(name.substring(1))
                .append(": ");

        for (int i = 0; i < sortedPages.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(sortedPages.get(i));
        }

        return sb.toString();
    }
}
