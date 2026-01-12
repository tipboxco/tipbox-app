import type { FlatList, ScrollView } from 'react-native';

/**
 * ScrollRegistry Service
 * 
 * Instagram/Twitter-style scroll-to-top pattern
 * 
 * Problem: useScrollToTop hook'u sadece aktif tab'da çalışır
 * Çözüm: Global scroll registry - hangi tab aktif olursa olsun scroll yapabilir
 * 
 * Usage:
 * ```ts
 * // FeedScreen'de
 * ScrollRegistry.register('feed', flatListRef);
 * 
 * // TabNavigator'da
 * ScrollRegistry.scrollToTop('feed');
 * ```
 */
type ScrollableRef = React.RefObject<FlatList<any> | ScrollView>;

class ScrollRegistryClass {
  private registry: Map<string, ScrollableRef> = new Map();

  /**
   * Scrollable component'i register et
   * @param key Unique key (e.g., 'feed', 'explore', 'inbox')
   * @param ref FlatList veya ScrollView ref'i
   */
  register(key: string, ref: ScrollableRef): void {
    if (!ref) {
      console.warn(`[ScrollRegistry] ⚠️ Attempted to register null ref for key: ${key}`);
      return;
    }

    this.registry.set(key, ref);
    console.log(`[ScrollRegistry] ✅ Registered scrollable: ${key}`);
  }

  /**
   * Scrollable component'i unregister et
   * @param key Unique key
   */
  unregister(key: string): void {
    const existed = this.registry.delete(key);
    if (existed) {
      console.log(`[ScrollRegistry] 🗑️ Unregistered scrollable: ${key}`);
    }
  }

  /**
   * Scroll to top
   * @param key Unique key
   * @param animated Animation kullanılsın mı (default: true)
   */
  scrollToTop(key: string, animated: boolean = true): boolean {
    const ref = this.registry.get(key);

    if (!ref) {
      console.warn(`[ScrollRegistry] ⚠️ No scrollable registered for key: ${key}`);
      return false;
    }

    if (!ref.current) {
      console.warn(`[ScrollRegistry] ⚠️ Ref is null for key: ${key}`);
      return false;
    }

    // CRITICAL FIX: Native view'e direkt erişim - FlatList'in native ScrollView'ine
    // React Navigation Native Stack inactive screen'leri optimize eder ve native view'i detach edebilir
    // Bu durumda scrollToOffset çalışmaz, native ScrollView'e direkt erişim gerekir
    const attemptScroll = (attempt: number = 0) => {
      if (!ref.current) {
        if (attempt < 5) {
          // 5 deneme yap (daha fazla deneme - native view'in mount olmasını bekle)
          setTimeout(() => attemptScroll(attempt + 1), 100 * (attempt + 1));
        } else {
          console.warn(`[ScrollRegistry] ⚠️ Ref is null after ${attempt} attempts for key: ${key}`);
        }
        return;
      }

      try {
        const flatList = ref.current as FlatList<any>;
        
        // CRITICAL FIX: scrollEnabled kontrolü
        if (flatList.props.scrollEnabled === false) {
          console.warn(`[ScrollRegistry] ⚠️ Scroll is disabled for key: ${key}`);
          if (attempt < 4) {
            setTimeout(() => attemptScroll(attempt + 1), 100);
            return;
          }
        }
        
        // FlatList için - native ScrollView'e direkt erişim (PRIMARY METHOD)
        if ('scrollToOffset' in flatList) {
          // Method 1: Native ScrollView'e direkt erişim - _scrollRef kullan
          // DEBUG log'unda _scrollRef key'i görünüyor, bu yüzden bu path'i kullanmalıyız
          try {
            const listRef = (flatList as any)._listRef;
            if (!listRef) {
              console.warn(`[ScrollRegistry] ⚠️ _listRef is null for key: ${key}`);
            } else {
              const scrollRef = listRef._scrollRef;
              
              if (!scrollRef) {
                console.warn(`[ScrollRegistry] ⚠️ _scrollRef is null for key: ${key}`);
              } else {
                // Path 1: _scrollRef.current (if it's a ref)
                let nativeScrollView = scrollRef.current || scrollRef;
                
                // Path 2: Try scrollTo method directly
                if (nativeScrollView?.scrollTo) {
                  nativeScrollView.scrollTo({ y: 0, animated });
                  console.log(`[ScrollRegistry] ✅ Scrolled to top: ${key} (Native ScrollView - PRIMARY via _scrollRef.scrollTo)`);
                  return;
                }
                
                // Path 3: Try scrollToOffset (FlatList method on native view)
                if (nativeScrollView?.scrollToOffset) {
                  nativeScrollView.scrollToOffset({ offset: 0, animated });
                  console.log(`[ScrollRegistry] ✅ Scrolled to top: ${key} (Native ScrollView via scrollToOffset)`);
                  return;
                }
                
                // Path 4: Try getNode() method
                if (nativeScrollView?.getNode) {
                  const node = nativeScrollView.getNode();
                  if (node?.scrollTo) {
                    node.scrollTo({ y: 0, animated });
                    console.log(`[ScrollRegistry] ✅ Scrolled to top: ${key} (Native ScrollView via getNode)`);
                    return;
                  }
                }
                
                // Path 5: Try _scrollRef._component (internal structure)
                if (scrollRef._component?.scrollTo) {
                  scrollRef._component.scrollTo({ y: 0, animated });
                  console.log(`[ScrollRegistry] ✅ Scrolled to top: ${key} (Native ScrollView via _component)`);
                  return;
                }
                
                // DEBUG: Log _scrollRef structure for further investigation
                console.log(`[ScrollRegistry] 🔍 _scrollRef structure:`, {
                  has_scrollRef: !!scrollRef,
                  scrollRef_type: typeof scrollRef,
                  scrollRef_keys: scrollRef ? Object.keys(scrollRef).slice(0, 20) : [], // First 20 keys
                  has_current: !!(scrollRef?.current),
                  current_type: typeof scrollRef?.current,
                  has_scrollTo: !!(scrollRef?.scrollTo || scrollRef?.current?.scrollTo),
                  has_scrollToOffset: !!(scrollRef?.scrollToOffset || scrollRef?.current?.scrollToOffset),
                  has_getNode: !!(scrollRef?.getNode || scrollRef?.current?.getNode),
                  has_component: !!(scrollRef?._component),
                });
              }
            }
          } catch (error) {
            console.warn(`[ScrollRegistry] ⚠️ Native ScrollView access failed:`, error);
          }

          // Method 2: scrollToOffset (fallback)
          try {
            flatList.scrollToOffset({ offset: 0, animated });
            console.log(`[ScrollRegistry] ✅ Scrolled to top: ${key} (FlatList.scrollToOffset, attempt ${attempt + 1})`);
            return;
          } catch (error) {
            if (attempt < 4) {
              setTimeout(() => attemptScroll(attempt + 1), 100);
              return;
            }
            console.warn(`[ScrollRegistry] ⚠️ scrollToOffset failed after ${attempt + 1} attempts:`, error);
          }

          // Method 3: scrollToIndex (last resort)
          try {
            if (flatList.props.data && flatList.props.data.length > 0) {
              flatList.scrollToIndex({ index: 0, animated, viewPosition: 0 });
              console.log(`[ScrollRegistry] ✅ Scrolled to top: ${key} (FlatList.scrollToIndex)`);
              return;
            }
          } catch (error) {
            console.warn(`[ScrollRegistry] ⚠️ scrollToIndex failed:`, error);
          }
        }

        // ScrollView için
        const scrollView = ref.current as ScrollView;
        if ('scrollTo' in scrollView) {
          scrollView.scrollTo({ y: 0, animated });
          console.log(`[ScrollRegistry] ✅ Scrolled to top: ${key} (ScrollView)`);
          return;
        }

        if (attempt < 4) {
          setTimeout(() => attemptScroll(attempt + 1), 100);
        } else {
          console.warn(`[ScrollRegistry] ⚠️ Unknown scrollable type for key: ${key}`);
        }
      } catch (error) {
        if (attempt < 4) {
          setTimeout(() => attemptScroll(attempt + 1), 100);
        } else {
          console.error(`[ScrollRegistry] ❌ Error scrolling to top for key: ${key}:`, error);
        }
      }
    };

    // İlk deneme - double requestAnimationFrame (native view'in mount olmasını bekle)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        attemptScroll(0);
      });
    });

    return true;
  }

  /**
   * Tüm register edilmiş scrollable'ları listele (debug için)
   */
  listRegistered(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Registry'yi temizle (test için)
   */
  clear(): void {
    this.registry.clear();
    console.log('[ScrollRegistry] 🗑️ Registry cleared');
  }
}

export const ScrollRegistry = new ScrollRegistryClass();
