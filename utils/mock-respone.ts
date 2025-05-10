import { MOCK_RESPONSES } from "@/constants";

export async function createMockResponse(action: keyof typeof MOCK_RESPONSES) {
    switch (action) {
      case MOCK_RESPONSES.SUCCESS:
        return new Promise((resolve) => 
          setTimeout(() => resolve(MOCK_RESPONSES.SUCCESS), 100)
        );
      case MOCK_RESPONSES.FAILURE:
        return new Promise((_, reject) => 
          setTimeout(() => reject(MOCK_RESPONSES.FAILURE), 1000)
        );
      case MOCK_RESPONSES.TIMEOUT:
        return new Promise((_, reject) => {
          // This promise will never resolve
          setTimeout(() => reject(MOCK_RESPONSES.FAILURE), 100000000)
        });
    }
}