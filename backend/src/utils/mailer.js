export const sendOtpEmail = async ({ to, otp }) => {
  console.log(`[mail] Envío de OTP a ${to}: ${otp}`);
  return { success: true, to, otp };
};
