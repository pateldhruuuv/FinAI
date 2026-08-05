const checkPermission = (user, feature) => {
  if (!feature) {
    return { allowed: true };
  }

  // If the feature requires premium but the user is not premium
  if (feature.premium && (!user || !user.isPremium)) {
    return {
      allowed: false,
      reason: 'Premium membership required',
      featureName: feature.name,
      featureDescription: feature.description
    };
  }

  return { allowed: true };
};

module.exports = {
  checkPermission
};
