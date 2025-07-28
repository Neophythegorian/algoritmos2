package models;

public class MatrixOperations {
    private static final String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static int[][] multiplyMatrices(int[][] key, int[][] msgMatrix) {
        int[][] result = new int[2][2];

        for (int i = 0; i < 2; i++) {
            for (int j = 0; j < 2; j++) {
                result[i][j] = (key[i][0] * msgMatrix[0][j] + key[i][1] * msgMatrix[1][j]) % 26;

                if (result[i][j] < 0) {
                    result[i][j] += 26;
                }
            }
        }

        return result;
    }

    public static String matrixToString(int[][] matrix) {
        StringBuilder text = new StringBuilder();
        for (int[] row : matrix) {
            for (int num : row) {
                text.append(alphabet.charAt(num));
            }
        }
        return text.toString();
    }
}