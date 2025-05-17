import Preference from "../models/Preference.js";


export const createPreference = async (req, res) => {
  
  const userId = req.user?.id; // Get user ID from auth middleware
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated." });
  }

  const { preferredShift, preferredOffDays, week, notes, unavailability } = req.body; // Added notes, unavailability
  
  // Basic validation
  if (typeof week === 'undefined' || preferredShift === undefined || preferredOffDays === undefined) {
    return res.status(400).json({ error: "Missing required fields: preferredShift, preferredOffDays, week." });
  }
 
  try {
    // Check if a preference for this user and week already exists to prevent duplicates via POST
    // This is a common cause for 409 if there's a unique index on user+week
    const existingPreference = await Preference.findOne({ user: userId, week });
    if (existingPreference) {
      return res.status(409).json({ error: "Preference for this user and week already exists. Use update instead." });
    }

    const preference = new Preference({
      user: userId,
      preferredShift,
      preferredOffDays,
      week,
      notes: notes || '',          // Use destructured notes, provide default if undefined
      unavailability: unavailability || '', // Use destructured unavailability, provide default if undefined
    });

    await preference.save();
    
    res.status(201).json(preference);
  } catch (error) {
   
    res.status(409).json({ error: error.message });
  }
};

export const updatePreference = async (req, res) => {
  const { id } = req.params; // Corrected from preferenceId to id
  const { preferredShift, preferredOffDays, notes, unavailability, week } = req.body; // Added notes, unavailability, week
  const authenticatedUser = req.user;

  if (!id) {
    return res.status(400).json({ error: "Preference ID is required in URL." });
  }
  if (typeof week === 'undefined' || preferredShift === undefined || preferredOffDays === undefined) {
    return res.status(400).json({ error: "Missing required fields: preferredShift, preferredOffDays, week." });
  }

  try {
    const preference = await Preference.findById(id);
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    // Authorization: User owns the preference or is an admin
    const isOwner = preference.user.toString() === authenticatedUser.id;
    const isAdmin = authenticatedUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this preference." });
    }

    // Prepare update data
    const updateData = {
      preferredShift,
      preferredOffDays,
      week, // Allow week to be updated if necessary, though typically preferences are per week
      notes: notes || preference.notes, // Keep existing if not provided
      unavailability: unavailability || preference.unavailability, // Keep existing if not provided
      // updatedAt will be handled by timestamps: true in the model
    };

    const updatedPreference = await Preference.findByIdAndUpdate(id, { $set: updateData }, { new: true }).populate('user', 'username');
    
    if (!updatedPreference) { // Should not happen if findById was successful, but good check
        return res.status(404).json({ error: "Preference not found after update attempt." });
    }
    res.status(200).json(updatedPreference);
  } catch (error) {
    console.error("Error in updatePreference:", error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'Invalid Preference ID format.' });
    }
    // Check for duplicate key error if user+week unique index exists and week is being changed to an existing one
    if (error.code === 11000) {
        return res.status(409).json({ error: "A preference for this user and week already exists." });
    }
    res.status(500).json({ error: "Server error while updating preference." });
  }
};

// Get all preferences for the authenticated user
export const getPreferenceByUser = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated." });
  }

  try {
    // Fetch all preferences for the authenticated user, sorted by week
    const preferences = await Preference.find({ user: userId }).sort({ week: 1 }).populate('user', 'username');
    if (!preferences || preferences.length === 0) {
      // It's not an error if a user has no preferences, return empty array
      return res.status(200).json([]);
    }
    res.status(200).json(preferences);
  } catch (error) {
    console.error("Error in getPreferenceByUser:", error);
    res.status(500).json({ error: "Server error while fetching user preferences." });
  }
};

export const getPreferenceById = async (req, res) => {
  const { id } = req.params; // Corrected from preferenceId to id
  const authenticatedUser = req.user;

  if (!id) {
    return res.status(400).json({ error: "Preference ID is required in URL." });
  }

  try {
    const preference = await Preference.findById(id).populate('user', 'username');
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    // Authorization: User owns the preference or is an admin
    const isOwner = preference.user._id.toString() === authenticatedUser.id; // Note: preference.user is populated
    const isAdmin = authenticatedUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to view this preference." });
    }

    res.status(200).json(preference);
  } catch (error) {
    console.error("Error in getPreferenceById:", error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'Invalid Preference ID format.' });
    }
    res.status(500).json({ error: "Server error while fetching preference." });
  }
};

export const deletePreference = async (req, res) => {
  const { id } = req.params; // Corrected from preferenceId to id
  const authenticatedUser = req.user;

  if (!id) {
    return res.status(400).json({ error: "Preference ID is required in URL." });
  }

  try {
    const preference = await Preference.findById(id);
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }

    // Authorization: User owns the preference or is an admin
    const isOwner = preference.user.toString() === authenticatedUser.id;
    const isAdmin = authenticatedUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this preference." });
    }

    await Preference.findByIdAndDelete(id); // Use findByIdAndDelete for direct deletion
    res.status(200).json({ message: "Preference deleted successfully" });
  } catch (error) {
    console.error("Error in deletePreference:", error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'Invalid Preference ID format.' });
    }
    res.status(500).json({ error: "Server error while deleting preference." });
  }
};

export const getAllPreferences = async (req, res) => {
  try {
    const preferences = await Preference.find().populate('user', 'username');
    res.status(200).json(preferences);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceByWeek = async (req, res) => {
  const { week } = req.params;

  try {
    const preferences = await Preference.find({ week });
    res.status(200).json(preferences);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceByShift = async (req, res) => {
  const { shift } = req.params;

  try {
    const preferences = await Preference.find({ preferredShift: shift });
    res.status(200).json(preferences);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceByOffDay = async (req, res) => {
  const { offDay } = req.params;

  try {
    const preferences = await Preference.find({ preferredOffDays: offDay });
    res.status(200).json(preferences);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceByWeekAndShift = async (req, res) => {
  const { week, shift } = req.params;

  try {
    const preferences = await Preference.find({ week, preferredShift: shift });
    res.status(200).json(preferences);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceByWeekAndOffDay = async (req, res) => {
  const { week, offDay } = req.params;

  try {
    const preferences = await Preference.find({ week, preferredOffDays: offDay });
    res.status(200).json(preferences);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceByShiftAndOffDay = async (req, res) => {
  const { shift, offDay } = req.params;

  try {
    const preferences = await Preference.find({ preferredShift: shift, preferredOffDays: offDay });
    res.status(200).json(preferences);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};


