package models;

import java.util.ArrayList;
import java.util.List;

public class message {
    private String message;
    private List<Character> characters;
    private List<Integer> numbers;
    private List<int[][]> matrices;

    public message(String message) {
        this.message = message.toUpperCase().replace(" ", "X");
        this.characters = new ArrayList<>();
        this.numbers = new ArrayList<>();
        this.matrices = new ArrayList<>();
        processMessage();
    }

    private void processMessage() {
        int padding = (4 - (message.length() % 4)) % 4;
        for (int i = 0; i < padding; i++) {
            message += 'X';
        }

        for (char c : message.toCharArray()) {
            characters.add(c);
        }

        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (char c : message.toCharArray()) {
            int position = alphabet.indexOf(c);
            if (position != -1) {
                numbers.add(position);
            }
        }

        for (int i = 0; i < numbers.size(); i += 4) {
            int[][] matrix = new int[2][2];
            matrix[0][0] = numbers.get(i);
            matrix[0][1] = numbers.get(i + 1);
            matrix[1][0] = numbers.get(i + 2);
            matrix[1][1] = numbers.get(i + 3);
            matrices.add(matrix);
        }
    }

    public List<int[][]> getMatrices() {
        return new ArrayList<>(matrices);
    }

    public void printMessageDetails() {
        System.out.println("\uD83D\uDCDC Mensaje original: " + message);
        System.out.println("Mensaje en caracteres: " + characters);
        System.out.println("Mensaje en numeros: " + numbers);
        System.out.println("Matrices 2x2: ");
        for (int[][] matrix : matrices) {
            System.out.println("[" + matrix[0][0] + " " + matrix[0][1] + "]");
            System.out.println("[" + matrix[1][0] + " " + matrix[1][1] + "]");
        }
    }
}