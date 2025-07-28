package ui;

import services.IndexService;
import models.Term;
import java.util.*;

public class CLI {
    private Scanner scanner;
    private IndexService indexService;

    public CLI() {
        this.scanner = new Scanner(System.in);
        this.indexService = new IndexService();
    }

    public void start() {
        System.out.println("=================================================");
        System.out.println("    SISTEMA DE ÍNDICE DE TÉRMINOS - MITZI");
        System.out.println("=================================================");

        boolean running = true;
        while (running) {
            showMenu();
            int choice = getIntInput("Seleccione una opción: ");

            switch (choice) {
                case 1:
                    loadFromFile();
                    break;
                case 2:
                    addTermManually();
                    break;
                case 3:
                    removeTerm();
                    break;
                case 4:
                    removePage();
                    break;
                case 5:
                    updateTermName();
                    break;
                case 6:
                    searchByPrefix();
                    break;
                case 7:
                    showMostFrequentTerm();
                    break;
                case 8:
                    displayIndex();
                    break;
                case 9:
                    saveToFile();
                    break;
                case 0:
                    running = false;
                    System.out.println("¡Gracias por usar el sistema de índice de términos!");
                    break;
                default:
                    System.out.println("Opción no válida. Intente de nuevo.");
            }

            if (running) {
                System.out.println("\nPresione Enter para continuar...");
                scanner.nextLine();
            }
        }
    }

    private void showMenu() {
        System.out.println("\n================= MENÚ PRINCIPAL =================");
        System.out.println("1.  Cargar términos desde archivo TXT");
        System.out.println("2.  Agregar/Actualizar término manualmente");
        System.out.println("3.  Eliminar término");
        System.out.println("4.  Eliminar página de un término");
        System.out.println("5.  Actualizar nombre de término");
        System.out.println("6.  Buscar términos por prefijo");
        System.out.println("7.  Mostrar término más frecuente");
        System.out.println("8.  Mostrar índice completo");
        System.out.println("9.  Guardar índice en archivo TXT");
        System.out.println("0.  Salir");
        System.out.println("=================================================");
    }

    private void loadFromFile() {
        System.out.println("\n--- CARGAR DESDE ARCHIVO TXT ---");
        System.out.print("Ingrese el nombre del archivo (ej: terminos.txt): ");
        String filename = scanner.nextLine().trim();

        if (filename.isEmpty()) {
            System.out.println("Nombre de archivo no válido.");
            return;
        }

        if (indexService.loadFromFile(filename)) {
            System.out.println("✓ Archivo cargado exitosamente.");
        } else {
            System.out.println("✗ Error al cargar el archivo.");
        }
    }

    private void addTermManually() {
        System.out.println("\n--- AGREGAR TÉRMINO MANUALMENTE ---");
        System.out.print("Ingrese el término: ");
        String termName = scanner.nextLine().trim();

        if (termName.isEmpty()) {
            System.out.println("El término no puede estar vacío.");
            return;
        }

        int page = getIntInput("Ingrese el número de página: ");
        if (page <= 0) {
            System.out.println("El número de página debe ser positivo.");
            return;
        }

        indexService.addTerm(termName, page);
        System.out.println("✓ Término agregado exitosamente.");

        System.out.print("¿Desea agregar más páginas a este término? (s/n): ");
        String response = scanner.nextLine().trim().toLowerCase();

        while (response.equals("s") || response.equals("si")) {
            page = getIntInput("Ingrese otro número de página: ");
            if (page > 0) {
                indexService.addTerm(termName, page);
                System.out.println("✓ Página agregada al término.");
            } else {
                System.out.println("Número de página inválido.");
            }

            System.out.print("¿Desea agregar más páginas? (s/n): ");
            response = scanner.nextLine().trim().toLowerCase();
        }
    }

    private void removeTerm() {
        System.out.println("\n--- ELIMINAR TÉRMINO ---");
        if (indexService.isEmpty()) {
            System.out.println("El índice está vacío.");
            return;
        }

        System.out.print("Ingrese el término a eliminar: ");
        String termName = scanner.nextLine().trim();

        if (termName.isEmpty()) {
            System.out.println("El término no puede estar vacío.");
            return;
        }

        if (indexService.removeTerm(termName)) {
            System.out.println("✓ Término eliminado exitosamente.");
        } else {
            System.out.println("✗ Término no encontrado.");
        }
    }

    private void removePage() {
        System.out.println("\n--- ELIMINAR PÁGINA DE UN TÉRMINO ---");
        if (indexService.isEmpty()) {
            System.out.println("El índice está vacío.");
            return;
        }

        System.out.print("Ingrese el nombre del término: ");
        String termName = scanner.nextLine().trim();

        if (termName.isEmpty()) {
            System.out.println("El término no puede estar vacío.");
            return;
        }

        Term term = indexService.getTerm(termName);
        if (term == null) {
            System.out.println("✗ El término \"" + termName + "\" no existe.");
            return;
        }

        List<Integer> pages = new ArrayList<>(term.getPages());
        Collections.sort(pages);
        System.out.println("Páginas actuales para \"" + termName + "\": " + pages);

        int page = getIntInput("Ingrese la página que desea eliminar: ");
        if (!pages.contains(page)) {
            System.out.println("✗ La página " + page + " no está asociada al término.");
            return;
        }

        System.out.print("¿Está seguro de eliminar la página " + page + " del término \"" + termName + "\"? (s/n): ");
        String confirmation = scanner.nextLine().trim().toLowerCase();

        if (confirmation.equals("s") || confirmation.equals("si")) {
            indexService.removePage(page, termName);
            System.out.println("✓ Página eliminada.");
        } else {
            System.out.println("Operación cancelada.");
        }
    }


    private void updateTermName() {
        System.out.println("\n--- ACTUALIZAR NOMBRE DE TÉRMINO ---");
        if (indexService.isEmpty()) {
            System.out.println("El índice está vacío.");
            return;
        }

        System.out.print("Ingrese el término actual: ");
        String oldName = scanner.nextLine().trim();

        if (oldName.isEmpty()) {
            System.out.println("El término no puede estar vacío.");
            return;
        }

        Term existingTerm = indexService.getTerm(oldName);
        if (existingTerm == null) {
            System.out.println("✗ Término no encontrado.");
            return;
        }

        System.out.println("Término encontrado: " + existingTerm.toString());
        System.out.print("Ingrese el nuevo nombre: ");
        String newName = scanner.nextLine().trim();

        if (newName.isEmpty()) {
            System.out.println("El nuevo nombre no puede estar vacío.");
            return;
        }

        if (indexService.updateTermName(oldName, newName)) {
            System.out.println("✓ Nombre del término actualizado exitosamente.");
        } else {
            System.out.println("✗ Error al actualizar el término.");
        }
    }

    private void searchByPrefix() {
        System.out.println("\n--- BUSCAR POR PREFIJO ---");
        if (indexService.isEmpty()) {
            System.out.println("El índice está vacío.");
            return;
        }

        System.out.print("Ingrese el prefijo a buscar: ");
        String prefix = scanner.nextLine().trim();

        if (prefix.isEmpty()) {
            System.out.println("El prefijo no puede estar vacío.");
            return;
        }

        List<Term> results = indexService.searchByPrefix(prefix);

        if (results.isEmpty()) {
            System.out.println("No se encontraron términos con el prefijo '" + prefix + "'.");
        } else {
            System.out.println("\n--- RESULTADOS ---");
            System.out.println("Términos encontrados con el prefijo '" + prefix + "':");
            for (Term term : results) {
                System.out.println("• " + term.toString());
            }
            System.out.println("Total: " + results.size() + " término(s)");
        }
    }

    private void showMostFrequentTerm() {
        System.out.println("\n--- TÉRMINO MÁS FRECUENTE ---");
        if (indexService.isEmpty()) {
            System.out.println("El índice está vacío.");
            return;
        }

        Term mostFrequent = indexService.getMostFrequentTerm();
        if (mostFrequent != null) {
            System.out.println("Término más frecuente:");
            System.out.println("• " + mostFrequent.toString());
            System.out.println("Aparece en " + mostFrequent.getPageCount() + " página(s)");
        } else {
            System.out.println("No hay términos en el índice.");
        }
    }

    private void displayIndex() {
        System.out.println("\n--- MOSTRAR ÍNDICE COMPLETO ---");
        indexService.displayIndex();
    }

    private void saveToFile() {
        System.out.println("\n--- GUARDAR EN ARCHIVO TXT ---");
        if (indexService.isEmpty()) {
            System.out.println("El índice está vacío. No hay nada que guardar.");
            return;
        }

        System.out.print("Ingrese el nombre del archivo (ej: indice.txt): ");
        String filename = scanner.nextLine().trim();

        if (filename.isEmpty()) {
            System.out.println("Nombre de archivo no válido.");
            return;
        }

        if (indexService.saveToFile(filename)) {
            System.out.println("✓ Índice guardado exitosamente en " + filename);
        } else {
            System.out.println("✗ Error al guardar el archivo.");
        }
    }

    private int getIntInput(String prompt) {
        while (true) {
            System.out.print(prompt);
            try {
                String input = scanner.nextLine().trim();
                return Integer.parseInt(input);
            } catch (NumberFormatException e) {
                System.out.println("Por favor ingrese un número válido.");
            }
        }
    }
}