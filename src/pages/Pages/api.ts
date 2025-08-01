// export const fetchUserNames = async (): Promise<string[]> => {
//     try {
//         const response = await fetch('/api/users');
//         if (!response.ok) {
//             throw new Error('Failed to fetch users');
//         }
//         return await response.json();
//     } catch (error) {
//         console.error('Error fetching users:', error);
//         return [];
//     }
// };

export const fetchUserNames = async (): Promise<string[]> => {
    try {
        const response = await fetch('http://localhost:5000/api/users/names');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user names:', error);
        return []; // Return empty array as fallback
    }
};
