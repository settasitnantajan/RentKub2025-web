import { formatDate, formatNumber } from "@/utils/formats";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import { FileText, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button"; // Import the Button component

Font.register({
  family: "NotoSansThai",
  src: "/fonts/NotoSansThai.ttf",
});

// style Invoice
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "NotoSansThai",
    fontSize: 12,
  },
  section: {
    marginBottom: 10,
  },
  header: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
  },
  cellHeader: {
    flex: 1,
    borderBottomWidth: 1,
    padding: 5,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
  cell: {
    flex: 1,
    borderBottomWidth: 1,
    padding: 5,
  },
  total: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
});

const BookingInvoice = ({ booking }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Invoice */}
      <View style={styles.section}>
        <Text style={styles.header}>RentKub</Text>
        <Text>รหัสการจอง: {booking.id}</Text>
        <Text>ชื่อที่พัก: {booking.landmark.title}</Text>
        <Text>วันที่ออกใบเสร็จ: {formatDate(new Date())}</Text>
      </View>

      {/* ตารางแสดงรายละเอียด */}
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cellHeader}>จำนวนคืน </Text>
          <Text style={styles.cellHeader}>ราคารวม</Text>
          <Text style={styles.cellHeader}>Check In</Text>
          <Text style={styles.cellHeader}>Check Out</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.cell}>{booking.totalNights} คืน</Text>
          <Text style={styles.cell}>{formatNumber(booking.total)} บาท</Text>
          <Text style={styles.cell}>{formatDate(booking.checkIn)}</Text>
          <Text style={styles.cell}>{formatDate(booking.checkOut)}</Text>
        </View>
      </View>

      {/* สรุปยอดรวม */}
      <View style={styles.section}>
        <Text style={styles.total}>
          ยอดรวม: {formatNumber(booking.total)} บาท
        </Text>
      </View>
    </Page>
  </Document>
);

const BookingPDF = ({
  booking,
  variant = "outline",
  size = "sm",
  className = "",
}) => {
  return (
    <PDFDownloadLink
      document={<BookingInvoice booking={booking} />}
      fileName={`invoice-${booking.id}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={loading} // Disable button while PDF is generating
        >
          {loading ? (
            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {loading ? "Generating..." : "View Invoice"}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default BookingPDF;
