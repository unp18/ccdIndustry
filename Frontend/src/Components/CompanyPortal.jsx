import { useState, useEffect } from "react";
import { ChevronDown, Edit2, Mail, Search, Phone, Building } from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-toastify";
import Loader from "./Loader";

export default function CompanyPortal() {
  const { user, userRole, isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // map to store companies with same dprEmail
  const companiesMap = new Map();
  filteredCompanies.forEach((company) => {
    const dprEmail = company.dprEmail;

    if (companiesMap.has(dprEmail)) {
      companiesMap.set(dprEmail, [...companiesMap.get(dprEmail), company]);
    } else {
      companiesMap.set(dprEmail, [company]);
    }
  });

  // function to fetch all the companies from api
  const fetchAllCompanies = async () => {
    try {
      const Response = await fetch(
        import.meta.env.VITE_API_BASE_URI + "/api/get-all-companies",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user?.email,
          }),
        }
      );
      const { message, companies } = await Response.json();

      if (Response.status !== 200) {
        console.error("Error fetching companies:", message);
        toast.error("Error fetching companies. Please try again later.");
        return;
      }
      if (companies.length === 0) {
        console.log("No companies found for this user.");
        toast.info("No companies found for this user.");
        return;
      }
      if (companies.length > 0) {
        console.log("Companies fetched successfully.");
        setCompanies(companies);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Network request failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // filter the companies based on the search query
  useEffect(() => {
    const filtered = companies.filter((company) => {
      if (searchQuery === "") return true;
      const lowerCaseQuery = searchQuery.toLowerCase();

      const lowerCaseDprEmail = company.dprEmail.toLowerCase();
      const lowerCaseCompanyName = company.name.toLowerCase();
      const lowerCaseProfiles = company.profiles.map((profile) =>
        profile.toLowerCase()
      );
      const lowerCasePOCs = company.pocs.map((poc) => poc.name.toLowerCase());
      const lowerCasePOCEmails = company.pocs.map((poc) =>
        poc.email.toLowerCase()
      );
      const lowerCasePOCStatus = company.pocs.map((poc) =>
        poc.status.toLowerCase()
      );

      return (
        lowerCaseDprEmail.includes(lowerCaseQuery) ||
        lowerCaseCompanyName.includes(lowerCaseQuery) ||
        lowerCaseProfiles.some((profile) => profile.includes(lowerCaseQuery)) ||
        lowerCasePOCs.some((poc) => poc.includes(lowerCaseQuery)) ||
        lowerCasePOCEmails.some((email) => email.includes(lowerCaseQuery)) ||
        lowerCasePOCStatus.some((status) => status.includes(lowerCaseQuery))
      );
    });

    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  // fetch all the companies on page load
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAllCompanies();
  }, [isAuthenticated]);

  if (loading) return <Loader loading={loading} />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-gray-50">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-800 mb-2">Company Portal</h1>
        <p className="text-gray-600">Manage your company points of contact and profiles</p>
      </div>
      
      <div className="w-full mb-6 relative">
        <div className="bg-white rounded-lg shadow-sm flex items-center relative overflow-hidden">
          <Search className="absolute left-4 text-gray-400" size={20} />
          <input
            type="text"
            name="query"
            placeholder="Search for a company..."
            className="w-full h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border border-gray-200 px-5 py-4 pl-12 text-gray-800 placeholder-gray-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-col space-y-4 w-full min-h-screen">
        {Array.from(companiesMap).length > 0 ? (
          Array.from(companiesMap).map(([dprEmail, companies], index) => {
            return (
              <DPR
                email={dprEmail}
                companies={companies}
                setCompanies={setCompanies}
                userRole={userRole}
                key={index}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Building size={48} />
            <p className="mt-4">No companies found. Try adjusting your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DPR({ email, companies, setCompanies, userRole }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Mail size={18} className="text-blue-600 mr-3" />
          <h2 className="text-lg font-medium text-gray-800">
            {email}
          </h2>
        </div>
        <button
          className={`p-2 rounded-full hover:bg-gray-100 transition-all ${
            isOpen ? "rotate-180" : "rotate-0"
          } duration-300`}
        >
          <ChevronDown size={20} className="text-gray-500" />
        </button>
      </div>

      <div
        className={`${
          isOpen ? "max-h-full py-2" : "max-h-0"
        } transition-all duration-300 overflow-hidden`}
      >
        <div className="space-y-4 px-4 pb-4">
          {companies.map((company, index) => (
            <Company
              key={index}
              name={company.name}
              pocs={company.pocs}
              profiles={company.profiles}
              id={company._id}
              setCompanies={setCompanies}
              userRole={userRole}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Company({ name, profiles, pocs, id, setCompanies, userRole }) {
  const { user } = useAuth();

  const updatePOCStatus = async (pocId, status) => {
    if (userRole !== "admin") return;
    try {
      const response = await fetch(
        import.meta.env.VITE_API_BASE_URI + "/api/update-poc-status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            companyId: id,
            pocId: pocId,
            status: status,
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Status updated successfully");

        setCompanies((prev) => {
          return prev.map((prevCompany) => {
            if (prevCompany._id === id) {
              const updatedPOCs = prevCompany.pocs.map((prevPOC) => {
                if (prevPOC._id === pocId) {
                  return {
                    ...prevPOC,
                    status: status,
                  };
                }
                return prevPOC;
              });

              return {
                ...prevCompany,
                pocs: updatedPOCs,
              };
            } else {
              return prevCompany;
            }
          });
        });
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Network request failed");
    }
  };

  const updatePOCRemark = async (pocId, remarks) => {
    if (userRole !== "admin") return;
    try {
      const response = await fetch(
        import.meta.env.VITE_API_BASE_URI + "/api/update-poc-remarks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            companyId: id,
            pocId: pocId,
            remarks: remarks,
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Remarks updated successfully");

        setCompanies((prev) => {
          return prev.map((prevCompany) => {
            if (prevCompany._id === id) {
              const updatedPOCs = prevCompany.pocs.map((prevPOC) => {
                if (prevPOC._id === pocId) {
                  return {
                    ...prevPOC,
                    remarks: remarks,
                  };
                }
                return prevPOC;
              });

              return {
                ...prevCompany,
                pocs: updatedPOCs,
              };
            } else {
              return prevCompany;
            }
          });
        });
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Network request failed");
    }
  };

  const handleDeleteCompany = async () => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(
        import.meta.env.VITE_API_BASE_URI + "/api/delete-company",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            companyId: id,
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Company deleted successfully");
        setCompanies((prev) => prev.filter((c) => c._id !== id));
      } else {
        toast.error(data.message || "Failed to delete company");
      }
    } catch (error) {
      toast.error("Network request failed");
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
     <div className="px-5 py-4 border-b border-gray-100 bg-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">{name}</h3>

        {userRole === "admin" && (
          <button
            onClick={() => handleDeleteCompany()}
            className="text-red-600 text-sm hover:underline"
          >
            Delete Company
          </button>
        )}
      </div>


      <div className="p-5">
        <div className="flex flex-wrap gap-6">
          <div className="w-full lg:w-1/4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Profiles</h4>
            <div className="flex flex-wrap gap-2">
              {profiles.map((profile, index) => (
                <div
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                  key={index}
                >
                  {profile}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Points of Contact</h4>
            <div className="space-y-3">
                {pocs.map((poc, index) => {
                const displayPOC = userRole === "dpr"
                  ? { ...poc, name: `HR${index + 1}`, email: `hr${index + 1}@example.com`, phone: 'XXXXXXX' }
                  : poc;

                return (
                  <POC
                  key={index}
                  name={displayPOC.name}
                  email={displayPOC.email}
                  phone={displayPOC.phone}
                  status={displayPOC.status}
                  remarks={displayPOC.remarks}
                  updateStatus={updatePOCStatus}
                  updateRemarks={updatePOCRemark}
                  id={poc._id}
                  userRole={userRole}
                  companyId={id}
                  setCompanies={setCompanies}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function POC({
  name,
  email,
  phone,
  status,
  remarks,
  updateRemarks,
  updateStatus,
  id,
  userRole,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRemark, setEditedRemark] = useState(remarks);

  const handleSave = () => {
    updateRemarks(id, editedRemark);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedRemark(remarks);
    setIsEditing(false);
  };

  // Status color mapping
  const statusColors = {
    "yet to contact": "bg-gray-100 text-gray-700",
    "ongoing": "bg-blue-50 text-blue-700",
    "onboarded": "bg-green-50 text-green-700",
    "rejected": "bg-red-50 text-red-700"
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="md:w-2/5">
          <div className="font-medium text-gray-800 mb-1">{name}</div>
          {userRole === 'admin' && (<div className="flex items-center gap-4 text-sm text-gray-600">
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              title={email}
            >
              <Mail size={16} />
              <span className="hidden sm:inline">{email}</span>
            </a>
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              title={phone}
            >
              <Phone size={16} />
              <span>{phone}</span>
            </a>
          </div>)}
        </div>

        <div className="md:w-1/4">
          <select
            value={status}
            className={`text-sm px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 ${statusColors[status]} cursor-pointer w-full transition-colors`}
            onChange={(e) => updateStatus(id, e.target.value)}
            disabled={userRole !== "admin"}
          >
            <option value="yet to contact">Yet to contact</option>
            <option value="ongoing">Ongoing</option>
            <option value="onboarded">Onboarded</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Remarks</h4>
            
            {isEditing ? (
              <textarea
                value={editedRemark}
                onChange={(e) => setEditedRemark(e.target.value)}
                className="w-full p-3 text-sm bg-gray-50 text-gray-800 rounded-md border border-gray-200 resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-600 break-words whitespace-pre-wrap bg-gray-50 p-3 rounded-md min-h-[60px] border border-gray-100">
                {remarks || "No remarks added yet."}
              </p>
            )}
          </div>

          {userRole === "admin" && (
            <div className="ml-4 flex items-center">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                  title="Edit Remarks"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
