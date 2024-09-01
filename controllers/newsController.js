import News from "../models/News.js";

// Create a news item
export const createNews = async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const newsItem = new News({
      title,
      description,
      image,
    });
    await newsItem.save();
    res.status(201).json(newsItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get all news items
export const getAllNews = async (req, res) => {
  try {
    const newsItems = await News.find();
    res.json(newsItems);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get a news item by ID
export const getNewsById = async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ msg: "News item not found" });
    }
    res.json(newsItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Update a news item by ID
export const updateNews = async (req, res) => {
  try {
    const { title, description, image } = req.body;

    // Find the existing news item
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ msg: "News item not found" });
    }

    // Perform the update
    newsItem.title = title;
    newsItem.description = description;
    newsItem.image = image;
    newsItem.updatedAt = Date.now();

    await newsItem.save();
    res.json(newsItem);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Delete a news item by ID
export const deleteNews = async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) {
      return res.status(404).json({ msg: "News item not found" });
    }
    await News.findByIdAndDelete(req.params.id);
    res.json({ msg: "News item removed" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};