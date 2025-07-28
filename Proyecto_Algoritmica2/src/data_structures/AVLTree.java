package data_structures;

import models.Term;
import java.util.*;

public class AVLTree {
    private TreeNode root;

    public void insert(Term term) {
        root = insert(root, term);
    }

    private TreeNode insert(TreeNode node, Term term) {
        if (node == null) {
            return new TreeNode(term);
        }

        int cmp = term.compareTo(node.term);
        if (cmp < 0) {
            node.left = insert(node.left, term);
        } else if (cmp > 0) {
            node.right = insert(node.right, term);
        } else {
            node.term.addPages(term.getPages());
            return node;
        }

        node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));

        int balance = getBalance(node);

        if (balance > 1 && term.compareTo(node.left.term) < 0) {
            return rightRotate(node);
        }

        if (balance < -1 && term.compareTo(node.right.term) > 0) {
            return leftRotate(node);
        }

        if (balance > 1 && term.compareTo(node.left.term) > 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        if (balance < -1 && term.compareTo(node.right.term) < 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    public Term search(String termName) {
        TreeNode node = search(root, termName.toLowerCase().trim());
        return node != null ? node.term : null;
    }

    private TreeNode search(TreeNode node, String termName) {
        if (node == null || node.term.getName().equals(termName)) {
            return node;
        }

        if (termName.compareTo(node.term.getName()) < 0) {
            return search(node.left, termName);
        }

        return search(node.right, termName);
    }

    public boolean delete(String termName) {
        TreeNode found = search(root, termName.toLowerCase().trim());
        if (found == null) return false;

        root = delete(root, termName.toLowerCase().trim());
        return true;
    }

    private TreeNode delete(TreeNode node, String termName) {
        if (node == null) return node;

        int cmp = termName.compareTo(node.term.getName());
        if (cmp < 0) {
            node.left = delete(node.left, termName);
        } else if (cmp > 0) {
            node.right = delete(node.right, termName);
        } else {
            if (node.left == null || node.right == null) {
                TreeNode temp = (node.left != null) ? node.left : node.right;
                if (temp == null) {
                    temp = node;
                    node = null;
                } else {
                    node = temp;
                }
            } else {
                TreeNode temp = minValueNode(node.right);
                node.term = temp.term;
                node.right = delete(node.right, temp.term.getName());
            }
        }

        if (node == null) return node;

        node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
        int balance = getBalance(node);

        if (balance > 1 && getBalance(node.left) >= 0) {
            return rightRotate(node);
        }
        if (balance > 1 && getBalance(node.left) < 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }
        if (balance < -1 && getBalance(node.right) <= 0) {
            return leftRotate(node);
        }
        if (balance < -1 && getBalance(node.right) > 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    public List<Term> inOrderTraversal() {
        List<Term> result = new ArrayList<>();
        inOrderTraversal(root, result);
        return result;
    }

    private void inOrderTraversal(TreeNode node, List<Term> result) {
        if (node != null) {
            inOrderTraversal(node.left, result);
            result.add(node.term);
            inOrderTraversal(node.right, result);
        }
    }

    private int getHeight(TreeNode node) {
        return node == null ? 0 : node.height;
    }

    private int getBalance(TreeNode node) {
        return node == null ? 0 : getHeight(node.left) - getHeight(node.right);
    }

    private TreeNode rightRotate(TreeNode y) {
        TreeNode x = y.left;
        TreeNode T2 = x.right;

        x.right = y;
        y.left = T2;

        y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;
        x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;

        return x;
    }

    private TreeNode leftRotate(TreeNode x) {
        TreeNode y = x.right;
        TreeNode T2 = y.left;

        y.left = x;
        x.right = T2;

        x.height = Math.max(getHeight(x.left), getHeight(x.right)) + 1;
        y.height = Math.max(getHeight(y.left), getHeight(y.right)) + 1;

        return y;
    }

    private TreeNode minValueNode(TreeNode node) {
        TreeNode current = node;
        while (current.left != null) {
            current = current.left;
        }
        return current;
    }

    public boolean isEmpty() {
        return root == null;
    }
}