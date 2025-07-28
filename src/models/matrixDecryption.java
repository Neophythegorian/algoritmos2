package models;

import java.util.List;

public class matrixDecryption {
    private Matrix keyMatrix;

    public matrixDecryption(Matrix keyMatrix) {
        this.keyMatrix = keyMatrix;
    }

    public String decryptMessage(List<int[][]> encryptedMatrices) {
        StringBuilder decryptedText = new StringBuilder();
        int[][] inverseKey = keyMatrix.getInverseMatrix();

        for (int[][] matrix : encryptedMatrices) {
            int[][] decryptedMatrix = MatrixOperations.multiplyMatrices(inverseKey, matrix);
            decryptedText.append(MatrixOperations.matrixToString(decryptedMatrix));
        }

        return decryptedText.toString().replace("X", " ");
    }

    public void printDecryptedMessage(List<int[][]> encryptedMatrices) {
        System.out.println("\n🔓 Mensaje descifrado: " + decryptMessage(encryptedMatrices));
    }
}