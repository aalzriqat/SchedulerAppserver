import Prodcasts from "../models/Prodcasts";

// Create a prodcast
export const createProdcast = async (req, res) => {
  try {
    const { title, description, duration, audio, image, category } = req.body;
    const prodcast = new Prodcasts({
      title,
      description,
      duration,
      audio,
      image,
      category,
    });
    await prodcast.save();
    res.status(201).json(prodcast);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get all prodcasts

export const getAllProdcasts = async (req, res) => {
  try {
    const prodcasts = await Prodcasts.find();
    res.json(prodcasts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Get prodcast by id

export const getProdcastById = async (req, res) => {
    try {
        const prodcast = await Prodcasts.findById(req.params.id);
        if (!prodcast) {
        return res.status(404).json({ msg: "Prodcast not found" });
        }
        res.json(prodcast);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    };

// Update a prodcast

export const updateProdcast = async (req, res) => {
    try {
        const { id, title, description, duration, audio, image, category } = req.body;
    
        // Find the existing prodcast
        const existingProdcast = await Prodcasts.findById(id);
        if (!existingProdcast) {
        return res.status(404).json({ msg: "Prodcast not found" });
        }
    
        // Perform the update
        existingProdcast.title = title;
        existingProdcast.description = description;
        existingProdcast.duration = duration;
        existingProdcast.audio = audio;
        existingProdcast.image = image;
        existingProdcast.category = category;
        existingProdcast.updatedAt = Date.now();
    
        await existingProdcast.save();
        res.json(existingProdcast);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    }

// Delete a prodcast

export const deleteProdcast = async (req, res) => {
    try {
        const prodcast = await Prodcasts.findById(req.params.id);
        if (!prodcast) {
        return res.status(404).json({ msg: "Prodcast not found" });
        }
        await prodcast.remove();
        res.json({ msg: "Prodcast removed" });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    }

// Like a prodcast

export const likeProdcast = async (req, res) => {
    try {
        const prodcast = await Prodcasts.findById(req.params.id);
        if (!prodcast) {
        return res.status(404).json({ msg: "Prodcast not found" });
        }
        prodcast.likes++;
        await prodcast.save();
        res.json(prodcast);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    }

// Comment on a prodcast

export const commentOnProdcast = async (req, res) => {
    try {
        const prodcast = await Prodcasts.findById(req.params.id);
        if (!prodcast) {
        return res.status(404).json({ msg: "Prodcast not found" });
        }
        prodcast.comments++;
        await prodcast.save();
        res.json(prodcast);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    }

// Get prodcasts by category

export const getProdcastsByCategory = async (req, res) => {
    try {
        const prodcasts = await Prodcasts.find({ category: req.params.category });
        res.json(prodcasts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    }

// Get prodcasts by search query

export const getProdcastsBySearchQuery = async (req, res) => {
    try {
        const prodcasts = await Prodcasts.find({
        $or: [
            { title: { $regex: req.params.query, $options: "i" } },
            { description: { $regex: req.params.query, $options: "i" } },
            { category: { $regex: req.params.query, $options: "i" } },
        ],
        });
        res.json(prodcasts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    }

// Get prodcasts by user

export const getProdcastsByUser = async (req, res) => {
    try {
        const prodcasts = await Prodcasts.find({ user: req.params.id });
        res.json(prodcasts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server error");
    }
    }