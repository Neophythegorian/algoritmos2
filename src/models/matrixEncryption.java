package models;

import java.util.List;
import java.util.ArrayList;

public class matrixEncryption {
    private Matrix keyMatrix;
    private message msg;
    private List<int[][]> encryptedMatrices;

    public matrixEncryption(Matrix keyMatrix, message msg) {
        this.keyMatrix = keyMatrix;
        this.msg = msg;
        this.encryptedMatrices = new ArrayList<>();
    }

    public String encryptMessage() {
        StringBuilder encryptedText = new StringBuilder();
        List<int[][]> messageMatrices = msg.getMatrices();
        int[][] key = keyMatrix.getMatrix();

        for (int[][] matrix : messageMatrices) {
            int[][] encryptedMatrix = MatrixOperations.multiplyMatrices(key, matrix);
            encryptedText.append(MatrixOperations.matrixToString(encryptedMatrix));

            encryptedMatrices.add(encryptedMatrix);
        }

        return encryptedText.toString();
    }

    public List<int[][]> getEncryptedMatrices() {
        return new ArrayList<>(encryptedMatrices);
    }

    public void printEncryptedMessage() {
        System.out.println("\n🔐 Mensaje cifrado: " + encryptMessage());
    }

}
