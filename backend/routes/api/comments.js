/**
 * Comments API Router
 * 
 * @module routes/api/comments
 * @requires express
 * @requires mongoose
 */

/**
 * GET /
 * Retrieves all comments from the database
 * 
 * @async
 * @route {GET} /
 * @returns {Object[]} Array of comment objects
 * @returns {number} 500 - Internal server error if fetch fails
 */

/**
 * DELETE /:id
 * Deletes a comment by its ID
 * 
 * @async
 * @route {DELETE} /:id
 * @param {string} id - The comment ID to delete
 * @returns {Object} Success message upon deletion
 * @returns {number} 404 - Comment not found
 * @returns {number} 500 - Internal server error if deletion fails
 */
const router = require("express").Router();
const mongoose = require("mongoose");
const Comment = mongoose.model("Comment");

module.exports = router;

// Hey GitHub Copilot, " and see if it completes your sentence!
router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

//  add another endpoint for deleting a comment
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});
