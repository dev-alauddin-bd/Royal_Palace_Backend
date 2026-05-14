import SSLCommerzPayment from "sslcommerz-lts";
import { AppError } from "../error/appError";
import { IBooking } from "../interfaces/booking.interfcae";
import { envVariable } from "../config";

export const sslcommerzPaymentInit = async (booking: IBooking) => {

  const paymentData = {
    total_amount: Number(booking.totalAmount), 
    currency: "BDT",
    tran_id: String(booking.transactionId),

    success_url: `${envVariable.SUCCESS_URL}?tran_id=${booking.transactionId}`,
    fail_url: envVariable.FAIL_URL,
    cancel_url: envVariable.CANCEL_URL,
    ipn_url: `${envVariable.BASE_URL}/api/payments/ipn`,

    product_name: "Hotel Room Booking",
    product_category: "Hotel",
    product_profile: "travel-vertical",

    hotel_name: "Royal Palace",
    length_of_stay: `${booking.nights} nights`,
    check_in_time: "12:00 PM",
    hotel_city: String(booking.city),

    cus_name: String(booking.name),
    cus_email: String(booking.email),
    cus_phone: String(booking.phone),
    cus_add1: String(booking.address),
    cus_city: String(booking.city),
    cus_postcode: String(booking.postcode),
    cus_country: "Bangladesh",

    shipping_method: "NO",

    value_a: booking._id?.toString(),
    value_b: booking.userId?.toString(),
  };

  const sslcz = new SSLCommerzPayment(
    envVariable.SSL_STORE_ID,
    envVariable.SSL_STORE_PASS,
    envVariable.SSL_IS_LIVE,
  );
  
  const response = (await sslcz.init(paymentData)) as {
    status: string;
    GatewayPageURL?: string;
    failedreason?: string;
  };

  if (response.status === "FAILED") {
    throw new AppError(
      response.failedreason ?? "Payment initialization failed",
      500,
    );
  } else if (!response) {
    throw new AppError("Payment initialization failed", 500);
  } else {
    return {
      paymentUrl: response.GatewayPageURL,
    };
  }
};
