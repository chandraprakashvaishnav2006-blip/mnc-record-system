#include <fstream>
#include <iostream>
#include <string>
#include <vector>

struct EmployeeRecord {
    std::string employeeId;
    int age;
    std::string name;
    std::string department;
    double salary;
    std::string contactNo;
    std::string address;
};

class RecordStorageManager {
public:
    explicit RecordStorageManager(const std::string& filePath) : filePath_(filePath) {}

    void saveRecords(const std::vector<EmployeeRecord>& records) {
        std::ofstream out(filePath_, std::ios::trunc);
        if (!out) {
            std::cerr << "Unable to open file for writing." << std::endl;
            return;
        }

        for (const auto& record : records) {
            out << record.employeeId << "|"
                << record.age << "|"
                << record.name << "|"
                << record.department << "|"
                << record.salary << "|"
                << record.contactNo << "|"
                << record.address << "\n";
        }

        out.close();
    }

    std::vector<EmployeeRecord> loadRecords() {
        std::vector<EmployeeRecord> records;
        std::ifstream in(filePath_);
        if (!in) {
            return records;
        }

        std::string line;
        while (std::getline(in, line)) {
            if (line.empty()) continue;

            EmployeeRecord record;
            size_t pos1 = line.find('|');
            size_t pos2 = line.find('|', pos1 + 1);
            size_t pos3 = line.find('|', pos2 + 1);
            size_t pos4 = line.find('|', pos3 + 1);
            size_t pos5 = line.find('|', pos4 + 1);
            size_t pos6 = line.find('|', pos5 + 1);

            record.employeeId = line.substr(0, pos1);
            record.age = std::stoi(line.substr(pos1 + 1, pos2 - pos1 - 1));
            record.name = line.substr(pos2 + 1, pos3 - pos2 - 1);
            record.department = line.substr(pos3 + 1, pos4 - pos3 - 1);
            record.salary = std::stod(line.substr(pos4 + 1, pos5 - pos4 - 1));
            record.contactNo = line.substr(pos5 + 1, pos6 - pos5 - 1);
            record.address = line.substr(pos6 + 1);
            records.push_back(record);
        }

        in.close();
        return records;
    }

private:
    std::string filePath_;
};

int main() {
    RecordStorageManager manager("employee_records.txt");

    std::vector<EmployeeRecord> records = {
        {"EMP-101", 28, "Aarav Sharma", "HR", 42000, "9876543210", "Jaipur"},
        {"EMP-102", 32, "Sneha Verma", "Engineering", 65000, "9988776655", "Delhi"},
    };

    manager.saveRecords(records);
    std::vector<EmployeeRecord> loaded = manager.loadRecords();

    std::cout << "Records saved and loaded successfully." << std::endl;
    for (const auto& record : loaded) {
        std::cout << record.employeeId << " | " << record.name << " | " << record.department << std::endl;
    }

    return 0;
}
