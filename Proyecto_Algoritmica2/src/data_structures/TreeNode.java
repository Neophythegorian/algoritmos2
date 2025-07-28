package data_structures;

import models.Term;

public class TreeNode {
    public Term term;
    public TreeNode left;
    public TreeNode right;
    public int height;

    public TreeNode(Term term) {
        this.term = term;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}
