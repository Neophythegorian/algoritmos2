import models.*;

import java.util.Scanner;
import java.util.List;

public class Main {
    public static void main(String[] args) {

        Matrix keyMatrix = new Matrix();
        keyMatrix.generateRandomMatrix();

        Scanner in = new Scanner(System.in);

        System.out.println("Ingrese el mensaje a cifrar: ");
        String userInput = in.nextLine();


        message msg = new message(userInput);
        msg.printMessageDetails();

        System.out.println("Matriz clave:");
        keyMatrix.showMatrix();

        System.out.println("Matriz inversa:");
        int[][] inverseMatrix = keyMatrix.getInverseMatrix();
        keyMatrix.showMatrix(inverseMatrix);

        matrixEncryption encryption = new matrixEncryption(keyMatrix, msg);
        encryption.printEncryptedMessage();

        List<int[][]> encryptedMatrices = encryption.getEncryptedMatrices();

        matrixDecryption decryption = new matrixDecryption(keyMatrix);
        decryption.printDecryptedMessage(encryptedMatrices);

        in.close();
    }
}
