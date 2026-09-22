import { isDeepStrictEqual } from "node:util";

export function preserveReviews(generated, previous, contentUnchanged) {
  if (!previous || !contentUnchanged) return generated;
  const { medicalReview, rightsReview, ...previousSource } = previous;
  const { medicalReview: ignoredMedical, rightsReview: ignoredRights, ...generatedSource } = generated;
  if (!isDeepStrictEqual(previousSource, generatedSource)) return generated;
  return { ...generated, medicalReview, rightsReview };
}
