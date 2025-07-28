package services;

import models.Term;
import models.TermIndex;
import java.io.*;
import java.util.*;

public class FileService {

    public boolean loadFromFile(String filename, TermIndex termIndex) {
        File file = new File("data", filename);

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) continue;

                String[] parts = line.split(":");
                if (parts.length != 2) continue;

                String termName = parts[0].trim();
                String[] pageStrings = parts[1].trim().split(",");

                List<Integer> pages = new ArrayList<>();
                for (String pageStr : pageStrings) {
                    try {
                        int page = Integer.parseInt(pageStr.trim());
                        if (page > 0) {
                            pages.add(page);
                        }
                    } catch (NumberFormatException e) {
                        System.err.println("Página inválida ignorada: " + pageStr.trim());
                    }
                }

                if (!pages.isEmpty()) {
                    termIndex.addTerm(termName, pages);
                }
            }

            System.out.println("Archivo cargado desde: " + file.getAbsolutePath());
            return true;
        } catch (IOException e) {
            System.err.println("Error al leer el archivo: " + e.getMessage());
            return false;
        }
    }

    public boolean saveToFile(String filename, TermIndex termIndex) {
        try {
            File directory = new File("Saves");
            if (!directory.exists()) {
                directory.mkdirs();
            }

            File file = new File(directory, filename);

            try (PrintWriter writer = new PrintWriter(new FileWriter(file))) {
                List<Term> terms = termIndex.getAllTerms();

                for (Term term : terms) {
                    List<Integer> sortedPages = new ArrayList<>(term.getPages());
                    Collections.sort(sortedPages);

                    writer.print(term.getName() + ": ");
                    for (int i = 0; i < sortedPages.size(); i++) {
                        if (i > 0) writer.print(", ");
                        writer.print(sortedPages.get(i));
                    }
                    writer.println();
                }

                System.out.println("Archivo guardado en: " + file.getAbsolutePath());
                return true;
            }

        } catch (IOException e) {
            System.err.println("Error al guardar el archivo: " + e.getMessage());
            return false;
        }
    }
}