import Preference from "../models/Preference.js";


export const createPreference = async (req, res) => {
  
  const { user, preferredShift, preferredOffDays, week } = req.body;
  
 
  try {
    const preference = new Preference({
      user,
      preferredShift,
      preferredOffDays,
      week,
    });

    await preference.save();
    
    res.status(201).json(preference);
  } catch (error) {
   
    res.status(409).json({ error: error.message });
  }
};

export const updatePreference = async (req, res) => {
  const { preferenceId } = req.params;
  const { preferredShift, preferredOffDays } = req.body;

  try {
    const preference = await Preference.findById(preferenceId);
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    await preference.updateOne({ preferredShift, preferredOffDays });
    res.status(200).json(preference);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceByUser = async (req, res) => {
  const { user } = req.params; // Changed from userId to user

  try {
    const preference = await Preference.findOne({ user: user }); // Changed from userId to user
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    res.status(200).json(preference);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const getPreferenceById = async (req, res) => {
  const { preferenceId } = req.params;

  try {
    const preference = await Preference.findById(preferenceId);
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    res.status(200).json(preference);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

export const deletePreference = async (req, res) => {
  const { preferenceId } = req.params;

  try {
    const preference = await Preference.findById(preferenceId);
    if (!preference) {
      return res.status(404).json({ error: "Preference not found" });
    }
    await preference.deleteOne();
    res.status(200).json({ message: "Preference deleted successfully" });
  } catch (error) {
    res.status(409).json({ error: error.message });
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


