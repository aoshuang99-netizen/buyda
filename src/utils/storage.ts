// Chrome Storage 工具类

export class StorageManager {
  /**
   * 保存数据到本地存储
   */
  static async save(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 从本地存储读取数据
   */
  static async get<T>(key: string): Promise<T | null> {
    return new Promise((resolve, _reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(result[key] as T || null);
        }
      });
    });
  }

  /**
   * 删除本地存储的数据
   */
  static async remove(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 清空所有本地存储
   */
  static async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 监听存储变化
   */
  static onChanged(
    callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void
  ): void {
    chrome.storage.onChanged.addListener(callback);
  }
}

// 用户偏好设置管理
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  autoAnalyze: boolean;
  showFloatingPanel: boolean;
}

export class PreferencesManager {
  private static readonly PREFERENCES_KEY = 'userPreferences';

  private static defaultPreferences: UserPreferences = {
    theme: 'light',
    language: 'zh-CN',
    autoAnalyze: true,
    showFloatingPanel: true
  };

  /**
   * 获取用户偏好
   */
  static async getPreferences(): Promise<UserPreferences> {
    const saved = await StorageManager.get<UserPreferences>(this.PREFERENCES_KEY);
    return saved || this.defaultPreferences;
  }

  /**
   * 更新用户偏好
   */
  static async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences();
    const updated = { ...current, ...updates };
    await StorageManager.save(this.PREFERENCES_KEY, updated);
    return updated;
  }

  /**
   * 重置为默认偏好
   */
  static async resetPreferences(): Promise<UserPreferences> {
    await StorageManager.save(this.PREFERENCES_KEY, this.defaultPreferences);
    return this.defaultPreferences;
  }
}

// 选品清单管理
export interface SelectionItem {
  id: string;
  asin: string;
  title: string;
  price: number;
  rank: number;
  profitRate: number;
  status: 'pending' | 'analyzing' | 'approved' | 'rejected';
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export class SelectionListManager {
  private static readonly SELECTION_LIST_KEY = 'selectionList';

  /**
   * 获取选品清单
   */
  static async getSelectionList(): Promise<SelectionItem[]> {
    const list = await StorageManager.get<SelectionItem[]>(this.SELECTION_LIST_KEY);
    return list || [];
  }

  /**
   * 添加到选品清单
   */
  static async addToSelectionList(item: Omit<SelectionItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<SelectionItem> {
    const list = await this.getSelectionList();
    const newItem: SelectionItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    list.push(newItem);
    await StorageManager.save(this.SELECTION_LIST_KEY, list);
    return newItem;
  }

  /**
   * 更新选品项
   */
  static async updateSelectionItem(id: string, updates: Partial<SelectionItem>): Promise<SelectionItem | null> {
    const list = await this.getSelectionList();
    const index = list.findIndex(item => item.id === id);

    if (index === -1) {
      return null;
    }

    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: Date.now()
    };

    await StorageManager.save(this.SELECTION_LIST_KEY, list);
    return list[index];
  }

  /**
   * 删除选品项
   */
  static async removeFromSelectionList(id: string): Promise<boolean> {
    const list = await this.getSelectionList();
    const filtered = list.filter(item => item.id !== id);

    if (filtered.length === list.length) {
      return false;
    }

    await StorageManager.save(this.SELECTION_LIST_KEY, filtered);
    return true;
  }

  /**
   * 清空选品清单
   */
  static async clearSelectionList(): Promise<void> {
    await StorageManager.save(this.SELECTION_LIST_KEY, []);
  }
}
