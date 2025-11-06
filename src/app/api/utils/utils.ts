export function formatDate(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  };

  const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(date);
  const parts = formattedDate.split(", ");

  const dayMonthYear = parts[0]?.split(" ") || [];
  const time = parts[1] || "";

  const day = dayMonthYear[0] || "";
  const month = dayMonthYear[1] || "";
  const year = dayMonthYear[2] || "";

  return `${day} ${month} ${year} ${time}`.trim();
}

export function generateUniqueToken(): string {
  const timestamp = Date.now().toString(36); // Convert timestamp to base-36
  const randomNum = Math.random().toString(36).substring(2, 10); // Generate a random base-36 string
  return `${timestamp}-${randomNum}`; // Combine timestamp and random number using backticks
}

export function convertDateFormat(dateString: any) {
  // Split the string into date and time parts
  if (dateString) {
    const [datePart, timePart] = dateString.split("T");

    // Remove the milliseconds and 'Z' from the time part
    const formattedTime = timePart.split(".")[0];

    // Return the formatted date string
    return `${datePart} ${formattedTime}`;
  } else {
    return "";
  }
}

export function formatDateTime(validityStart: any) {
  // Parse the date string in UTC
  const date = new Date(validityStart);

  // Get the local date and time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Return the formatted date string
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
