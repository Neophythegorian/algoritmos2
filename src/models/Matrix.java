package models;

import java.util.Random;

public class Matrix {
    private int[][] matrix;

    public Matrix() {
    }

    public Matrix(int[][] matrix) {
        this.matrix = matrix;
    }

    public void generateRandomMatrix() {
        Random random = new Random();
        do {
            matrix = new int[2][2];
            for (int i = 0; i < 2; i++) {
                for (int j = 0; j < 2; j++) {
                    matrix[i][j] = random.nextInt(26);
                }
            }
        } while (!isValidKey());
    }

    public boolean isValidKey() {
        if (matrix == null || matrix.length != matrix[0].length) {
            return false;
        }

        int determinant = calculateDeterminant();
        return gcd(determinant, 26) == 1;
    }

    private int calculateDeterminant() {
        int a = matrix[0][0];
        int b = matrix[0][1];
        int c = matrix[1][0];
        int d = matrix[1][1];

        return (a * d - b * c) % 26;
    }

    private int gcd(int a, int b) {
        if (b == 0) {
            return a;
        }
        return gcd(b, a % b);
    }

    public void showMatrix(int[][] matrix) {
        for (int[] fila : matrix) {
            for (int valor : fila) {
                System.out.print(valor + "\t");
            }
            System.out.println();
        }
    }

    public void showMatrix() {
        showMatrix(this.matrix);
    }

    public int[][] getMatrix() {
        return matrix;
    }

    public int[][] getInverseMatrix() {
        int determinant = calculateDeterminant();
        if (gcd(determinant, 26) != 1) {
            throw new IllegalStateException("La matriz no tiene inversa módulo 26.");
        }

        int inverseDeterminant = -1;
        for (int i = 0; i < 26; i++) {
            if ((determinant * i) % 26 == 1) {
                inverseDeterminant = i;
                break;
            }
        }

        if (inverseDeterminant == -1) {
            throw new IllegalStateException("No se pudo encontrar el inverso multiplicativo del determinante.");
        }

        int a = matrix[0][0];
        int b = matrix[0][1];
        int c = matrix[1][0];
        int d = matrix[1][1];

        int[][] adjugate = {
                {d, -b},
                {-c, a}
        };

        int[][] inverseMatrix = new int[2][2];
        for (int i = 0; i < 2; i++) {
            for (int j = 0; j < 2; j++) {
                inverseMatrix[i][j] = (adjugate[i][j] * inverseDeterminant) % 26;
                if (inverseMatrix[i][j] < 0) {
                    inverseMatrix[i][j] += 26;
                }
            }
        }

        return inverseMatrix;
    }
}