import { useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { deleteUser, fetchAdminUsers, updateUserRole } from "../../redux/slices/adminSlice";

const UserManagement = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.admin);
  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const handleRoleChange = (id, role) => {
    dispatch(updateUserRole({ id, role }))
      .unwrap()
      .then(() => toast.success("Role updated"))
      .catch((message) => toast.error(message));
  };

  const handleDelete = (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    dispatch(deleteUser(user._id))
      .unwrap()
      .then(() => toast.success("User deleted"))
      .catch((message) => toast.error(message));
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-7">Users</h1>
      <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5 hidden sm:table-cell">Email</th>
              <th className="px-5 py-3.5 hidden md:table-cell">Joined</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-soft">
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user._id === currentUser?._id;
                return (
                  <tr key={user._id} className="border-t border-sand hover:bg-ivory transition-colors">
                    <td className="px-5 py-3.5 font-medium">
                      {user.name} {isSelf && <span className="text-xs text-deshi-green">(you)</span>}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-ink-soft">{user.email}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-ink-soft">
                      {new Date(user.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={user.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="border border-sand rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={isSelf}
                        className="p-2 rounded-lg bg-sand hover:bg-deshi-red hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Delete user"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
